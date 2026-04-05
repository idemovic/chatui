import type { ChatConfig } from '../types/index.ts'

export class N8nApiError extends Error {
  readonly status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'N8nApiError'
    this.status = status
  }
}

/**
 * Send a message to the n8n webhook.
 *
 * Non-streaming: expects { output: string } response.
 * Streaming: SSE; each event contains data: { text: "chunk" } or data: { output: "full" }.
 *
 * @param config   Chat configuration
 * @param sessionId  Current session ID (maps to chatSessionKey)
 * @param text     User message text
 * @param onChunk  Called with each streaming chunk (enables streaming mode)
 * @returns Full bot response text
 */
export async function sendMessage(
  config: ChatConfig,
  sessionId: string,
  text: string,
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
    ...config.metadata,
  }

  const isStreaming = config.streaming && onChunk !== undefined

  if (isStreaming) {
    headers['Accept'] = 'text/event-stream'
  }

  const res = await fetch(config.webhookUrl, {
    method,
    headers,
    body: method !== 'GET' ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    throw new N8nApiError(`Webhook returned ${res.status}`, res.status)
  }

  if (isStreaming && res.body) {
    return readStream(res.body, onChunk!)
  }

  const data = (await res.json()) as Record<string, unknown>
  const output = (data['output'] ?? data['text'] ?? '') as string
  return output
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
