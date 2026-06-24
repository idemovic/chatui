import type { ChatConfig, Attachment } from '../types/index.ts'

export class N8nApiError extends Error {
  readonly status?: number
  /**
   * True when the underlying transport or status code indicates the request can be safely
   * retried (network failure, 408, 429, 502/503/504). 4xx responses (other than 408/429) and
   * any error that occurred after streaming chunks have been written are non-retryable.
   */
  readonly retryable: boolean
  constructor(message: string, status?: number, retryable = false) {
    super(message)
    this.name = 'N8nApiError'
    this.status = status
    this.retryable = retryable
  }
}

/** Retry policy applied to transient transport failures and gateway statuses. */
const MAX_RETRIES = 2 // Total attempts: 1 initial + up to MAX_RETRIES retries
const BACKOFFS_MS: readonly number[] = [500, 1500]

/**
 * Send a message to the n8n webhook.
 *
 * Non-streaming: expects { output: string } response.
 * Streaming: SSE; each event contains data: { text: "chunk" } or data: { output: "full" }.
 *
 * Automatically retries transient transport failures (network errors, 408, 429, 502/503/504)
 * with short backoff. Other 4xx and any error that occurs *after* streaming has begun are
 * surfaced immediately — duplicating partially-delivered content would be worse than failing.
 *
 * @param config   Chat configuration
 * @param sessionId  Current session ID (maps to chatSessionKey)
 * @param text     User message text
 * @param language Optional ISO 639-1 code forwarded to n8n
 * @param onChunk  Called with each streaming chunk (enables streaming mode)
 * @returns Full bot response text
 */
export async function sendMessage(
  config: ChatConfig,
  sessionId: string,
  text: string,
  language?: string,
  attachments?: Attachment[],
  onChunk?: (chunk: string) => void,
): Promise<string> {
  const chatInputKey = config.chatInputKey ?? 'chatInput'
  const chatSessionKey = config.chatSessionKey ?? 'sessionId'
  const method = config.webhookConfig?.method ?? 'POST'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.webhookConfig?.headers,
  }

  const body: Record<string, unknown> = {
    [chatInputKey]: text,
    [chatSessionKey]: sessionId,
    ...(language ? { language } : {}),
    ...(attachments && attachments.length > 0 ? { attachments } : {}),
    ...(config.isTest ? { isTest: true } : {}),
    ...config.metadata,
  }

  const isStreaming = config.streaming && onChunk !== undefined

  if (isStreaming) {
    headers['Accept'] = 'text/event-stream'
  }

  let lastError: unknown

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Honor Retry-After when the last failure was a 429 with a value we can parse.
      const retryAfterMs =
        lastError instanceof N8nApiError && lastError.status === 429
          ? extractRetryAfter(lastError)
          : null
      const wait = retryAfterMs ?? BACKOFFS_MS[attempt - 1] ?? 4000
      await sleep(wait)
    }

    try {
      let res: Response
      try {
        res = await fetch(config.webhookUrl, {
          method,
          headers,
          body: method !== 'GET' ? JSON.stringify(body) : undefined,
        })
      } catch (err) {
        // Transport failure (DNS, offline, TLS) — always treated as retryable.
        const msg = err instanceof Error ? err.message : String(err)
        throw new N8nApiError(`Network error: ${msg}`, undefined, true)
      }

      if (!res.ok) {
        const retryable = isRetryableStatus(res.status)
        const retryAfter = res.headers.get('Retry-After')
        const enriched = new N8nApiError(
          `Webhook returned ${res.status}`,
          res.status,
          retryable,
        )
        if (retryAfter) {
          ;(enriched as unknown as { retryAfter: string }).retryAfter = retryAfter
        }
        throw enriched
      }

      if (isStreaming && res.body) {
        // Once we start reading the stream, any failure is non-retryable: chunks may have
        // already been pushed into the UI and replaying the call would duplicate them.
        return await readStream(res.body, onChunk!)
      }

      // Tolerate empty bodies / 204s: n8n short-circuits with no payload when a live agent
      // is handling the conversation. Caller treats '' as the awaiting-agent signal.
      const raw = await res.text()
      if (!raw) return ''
      try {
        const data = JSON.parse(raw) as Record<string, unknown>
        return (data['output'] ?? data['text'] ?? '') as string
      } catch {
        return ''
      }
    } catch (err) {
      lastError = err
      const isRetryable = err instanceof N8nApiError && err.retryable
      if (!isRetryable || attempt === MAX_RETRIES) throw err
    }
  }

  // Unreachable — the loop either returns on success or throws on the final attempt.
  throw lastError
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status === 502 || status === 503 || status === 504
}

function extractRetryAfter(err: N8nApiError): number | null {
  const raw = (err as unknown as { retryAfter?: string }).retryAfter
  if (!raw) return null
  // Retry-After can be either delta-seconds or an HTTP date.
  const asSeconds = Number(raw)
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return Math.min(asSeconds * 1000, 10_000)
  }
  const asDate = Date.parse(raw)
  if (!Number.isNaN(asDate)) {
    return Math.max(0, Math.min(asDate - Date.now(), 10_000))
  }
  return null
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function readStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (chunk: string) => void,
): Promise<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      const raw = line.slice(5).trim()
      if (raw === '[DONE]') continue
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>
        const chunk = (parsed['text'] ?? parsed['output'] ?? '') as string
        if (chunk) {
          onChunk(chunk)
          full += chunk
        }
      } catch {
        // non-JSON SSE line — skip
      }
    }
  }

  return full
}
