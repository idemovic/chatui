import { useState, useRef, useCallback } from 'react'
import { Trans } from 'react-i18next'
import { useSettingsStore } from '../store/settingsStore.ts'
import { useChatStore } from '../store/chatStore.ts'
import type { Attachment } from '../types/index.ts'

interface Props {
  onSend: (text: string, attachments?: Attachment[]) => void
  disabled?: boolean
  placeholder?: string
  allowFileUploads?: boolean
}

async function getUploadToken(config: any, sessionId: string): Promise<string | null> {
  const stream = config.agentStream
  if (!stream || !stream.apiBaseUrl || !stream.tenantId) return null

  // Check if we already have a token in the store and it's not expired
  const tokenData = useChatStore.getState().tokens?.[sessionId]
  if (tokenData && tokenData.expiresAt > Date.now() + 60000) { // valid for at least 1 min
    return tokenData.token
  }

  // Otherwise, fetch a new one
  try {
    const res = await fetch(`${stream.apiBaseUrl.replace(/\/$/, '')}/api/public/chat-stream/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: stream.tenantId, sessionId }),
    })
    if (!res.ok) return null
    const init = (await res.json()) as { token: string; expiresAt: string }

    // Save to store
    useChatStore.getState().setToken(sessionId, init.token, Date.parse(init.expiresAt))
    return init.token
  } catch {
    return null
  }
}

export function InputArea({ onSend, disabled, placeholder, allowFileUploads }: Props) {
  const [value, setValue] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const config = useSettingsStore((s) => s.config)
  const activeSessionId = useChatStore((s) => s.activeSessionId)

  const submit = useCallback(() => {
    const text = value.trim()
    const hasAttachments = attachments.length > 0
    if ((!text && !hasAttachments) || disabled || uploading) return

    onSend(text, attachments)
    setValue('')
    setAttachments([])
    setUploadError(null)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, disabled, uploading, attachments, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        submit()
      }
    },
    [submit],
  )

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    // 1. Enforce 5MB size limit on ChatUI side
    const maxSizeBytes = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSizeBytes) {
      setUploadError("File size exceeds the maximum limit of 5MB.")
      e.target.value = ''
      return
    }

    // 2. Validate file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    const allowedStr = config.allowedFileExtensions ?? '.pdf,.docx,.png,.jpg,.jpeg'
    const allowedExtensions = allowedStr
      .split(',')
      .map((ext) => ext.trim().toLowerCase())

    if (!allowedExtensions.includes(extension)) {
      setUploadError(`File type not allowed. Allowed types: ${allowedStr}`)
      e.target.value = ''
      return
    }

    // 3. Upload file
    const sessionId = activeSessionId ?? useChatStore.getState().createSession()
    const token = await getUploadToken(config, sessionId)
    if (!token) {
      setUploadError("Unable to authenticate file upload.")
      e.target.value = ''
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const apiBase = config.agentStream?.apiBaseUrl?.replace(/\/$/, '') ?? ''
      const uploadUrl = `${apiBase}/api/public/files/upload?t=${encodeURIComponent(token)}`

      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Upload failed with status ${res.status}`)
      }

      const attachment = (await res.json()) as Attachment
      setAttachments((prev) => [...prev, attachment])
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file.")
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div
      className="border-t"
      style={{ borderColor: 'var(--t-bg-border)', background: 'var(--t-bg-base)' }}
    >
      {/* Uploading loading state indicator */}
      {uploading && (
        <div className="flex items-center gap-2 px-3 pt-2 text-xs text-fg-secondary">
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Uploading file...</span>
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="flex items-center justify-between gap-2 px-3 pt-2 text-xs text-red-500 font-medium">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="opacity-80 hover:opacity-100 focus:outline-none">
            Dismiss
          </button>
        </div>
      )}

      {/* Uploaded attachments preview row */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pt-2 pb-1 border-b" style={{ borderColor: 'var(--t-bg-border)' }}>
          {attachments.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: 'var(--t-bg-surface2, var(--t-bg-surface))',
                color: 'var(--t-fg-primary)',
                border: '1px solid var(--t-bg-border)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
              </svg>
              <span className="truncate max-w-[120px]">{file.name}</span>
              {file.size && (
                <span className="opacity-60">({(file.size / 1024).toFixed(0)} KB)</span>
              )}
              <button
                type="button"
                onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-fg-secondary hover:text-fg-primary transition-colors focus:outline-none"
                title="Remove attachment"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
        {allowFileUploads && (
          <label
            className={`flex-shrink-0 w-[42px] h-[42px] rounded-xl flex items-center justify-center text-fg-secondary hover:text-fg-primary hover:bg-bg-surface transition-colors cursor-pointer ${(disabled || uploading) ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
            title="Attach file"
          >
            <input
              type="file"
              accept={config.allowedFileExtensions ?? '.pdf,.docx,.png,.jpg,.jpeg'}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={disabled || uploading}
            />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </label>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'Type a message… (Enter to send, Shift+Enter for newline)'}
          disabled={disabled}
          rows={1}
          className="flex-1 rounded-xl px-4 py-2.5 text-base md:text-sm leading-relaxed focus:outline-none disabled:opacity-50 min-h-[42px]"
          style={{
            background: 'var(--t-bg-surface)',
            color: 'var(--t-fg-primary)',
            border: '1px solid var(--t-bg-border)',
            resize: 'none',
          }}
        />

        <button
          onClick={submit}
          disabled={disabled || uploading || (!value.trim() && attachments.length === 0)}
          className="flex-shrink-0 w-[42px] h-[42px] rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--t-accent)', color: 'var(--t-accent-fg)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 2 11 13" />
            <path d="m22 2-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>

      <div className="text-center text-[11px] pb-2 px-3 text-fg-muted">
        <Trans
          i18nKey="footer.poweredBy"
          values={{ label: 'ELIA AI Assistant' }}
          components={{
            a: (
              <a
                href="https://www.elia-asistent.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ color: 'inherit' }}
              />
            ),
          }}
        />
      </div>
    </div>
  )
}
