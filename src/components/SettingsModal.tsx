import { useState, useCallback, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../store/settingsStore.ts'
import { builtInAvatarIds, builtInAvatars, resolveAvatarUrl } from '../assets/avatars/index.ts'
import { ThemePicker } from './ThemePicker.tsx'
import type { ChatConfig, LangOverride } from '../types/index.ts'

const MAX_UPLOAD_BYTES = 500 * 1024

interface Props {
  onClose: () => void
}

const KNOWN_LANGS = [
  { code: 'en', label: 'EN – English' },
  { code: 'sk', label: 'SK – Slovak' },
  { code: 'de', label: 'DE – German' },
  { code: 'cs', label: 'CS – Czech' },
  { code: 'pl', label: 'PL – Polish' },
  { code: 'hu', label: 'HU – Hungarian' },
  { code: 'fr', label: 'FR – French' },
  { code: 'es', label: 'ES – Spanish' },
]

export function SettingsModal({ onClose }: Props) {
  const { t } = useTranslation()
  const { config, setConfig, language, setLanguage, activeTheme } = useSettingsStore()

  const [local, setLocal] = useState<ChatConfig>({ ...config })
  const [metaError, setMetaError] = useState('')
  const [metaRaw, setMetaRaw] = useState(() => {
    try { return JSON.stringify(local.metadata ?? {}, null, 2) } catch { return '{}' }
  })
  const [showExport, setShowExport] = useState(false)
  const [copied, setCopied] = useState(false)

  const exportCode = (() => {
    let metadata: Record<string, unknown> | undefined
    const trimmed = metaRaw.trim()
    if (trimmed && trimmed !== '{}') {
      try { metadata = JSON.parse(trimmed) as Record<string, unknown> } catch { /* ignore */ }
    }
    const cfg = { ...local, metadata }
    Object.keys(cfg).forEach((k) => {
      if ((cfg as Record<string, unknown>)[k] === undefined) {
        delete (cfg as Record<string, unknown>)[k]
      }
    })
    return `import { useSettingsStore } from 'chatui/store'

useSettingsStore.getState().setConfig(${JSON.stringify(cfg, null, 2)})

useSettingsStore.getState().setTheme(${JSON.stringify(activeTheme)})
useSettingsStore.getState().setLanguage(${JSON.stringify(language)})
`
  })()

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(exportCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [exportCode])

  // Per-language tab state
  const langKeys = Object.keys(local.i18n ?? {})
  const allLangTabs = Array.from(new Set(['en', 'sk', ...langKeys]))
  const [activeLangTab, setActiveLangTab] = useState(language)
  const [newLangCode, setNewLangCode] = useState('')
  const [showAddLang, setShowAddLang] = useState(false)

  const getLangData = (lang: string): LangOverride =>
    local.i18n?.[lang] ?? {}

  const setLangData = (lang: string, patch: Partial<LangOverride>) => {
    setLocal((l) => ({
      ...l,
      i18n: { ...l.i18n, [lang]: { ...getLangData(lang), ...patch } },
    }))
  }

  const handleAddLang = useCallback(() => {
    const code = newLangCode.trim().toLowerCase()
    if (!code || allLangTabs.includes(code)) return
    setLocal((l) => ({
      ...l,
      i18n: { ...l.i18n, [code]: {} },
    }))
    setActiveLangTab(code)
    setNewLangCode('')
    setShowAddLang(false)
  }, [newLangCode, allLangTabs])

  const handleSave = useCallback(() => {
    let metadata: Record<string, unknown> | undefined
    const trimmed = metaRaw.trim()
    if (trimmed && trimmed !== '{}') {
      try {
        metadata = JSON.parse(trimmed) as Record<string, unknown>
        setMetaError('')
      } catch {
        setMetaError('Invalid JSON')
        return
      }
    }
    setConfig({ ...local, metadata })
    onClose()
  }, [local, metaRaw, setConfig, onClose])

  const activeLangData = getLangData(activeLangTab)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: 'var(--t-bg-surface)',
          border: '1px solid var(--t-bg-border)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--t-bg-border)' }}
        >
          <h2 className="text-base font-semibold text-fg-primary">{t('settings.title')}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-fg-muted hover:text-fg-primary hover:bg-bg-surface2 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {showExport ? (
          <div className="px-6 py-5 space-y-3 overflow-y-auto flex-1">
            <p className="text-xs text-fg-secondary leading-relaxed">
              Paste this into your host app's bootstrap file (e.g. <code>src/main.tsx</code>) before the first React render. See <code>example.html</code> for the full integration guide.
            </p>
            <textarea
              readOnly
              value={exportCode}
              className="w-full font-mono text-xs p-3 rounded-lg resize-none"
              style={{
                background: 'var(--t-bg-surface2)',
                color: 'var(--t-fg-primary)',
                border: '1px solid var(--t-bg-border)',
                minHeight: '300px',
                outline: 'none',
              }}
              onClick={(e) => e.currentTarget.select()}
            />
          </div>
        ) : (
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">

          {/* ── Interface language ── */}
          <Field label={t('settings.language')}>
            <div className="flex flex-wrap gap-2">
              {[
                { code: 'en', label: 'EN' },
                { code: 'sk', label: 'SK' },
              ].map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className="px-3 py-1 rounded-lg text-sm transition-colors"
                  style={
                    language === l.code
                      ? { background: 'var(--t-accent)', color: 'var(--t-accent-fg)' }
                      : { background: 'var(--t-bg-surface2)', color: 'var(--t-fg-secondary)' }
                  }
                >
                  {l.label}
                </button>
              ))}
            </div>
          </Field>

          {/* ── Theme ── */}
          <Field label={t('settings.theme') ?? 'Theme'}>
            <ThemePicker />
          </Field>

          <hr style={{ borderColor: 'var(--t-bg-border)' }} />

          {/* ── Webhook + keys ── */}
          <Field label={t('settings.webhookUrl')} required>
            <input
              type="url"
              value={local.webhookUrl}
              onChange={(e) => setLocal((l) => ({ ...l, webhookUrl: e.target.value }))}
              placeholder="https://your-n8n.app.n8n.cloud/webhook/..."
              className="input-field"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('settings.chatInputKey')}>
              <input
                value={local.chatInputKey ?? 'chatInput'}
                onChange={(e) => setLocal((l) => ({ ...l, chatInputKey: e.target.value }))}
                className="input-field"
              />
            </Field>
            <Field label={t('settings.sessionKey')}>
              <input
                value={local.chatSessionKey ?? 'sessionId'}
                onChange={(e) => setLocal((l) => ({ ...l, chatSessionKey: e.target.value }))}
                className="input-field"
              />
            </Field>
          </div>

          <Field label={t('settings.botName')}>
            <input
              value={local.botName ?? ''}
              onChange={(e) => setLocal((l) => ({ ...l, botName: e.target.value }))}
              placeholder="Assistant"
              className="input-field"
            />
          </Field>

          <Field label={t('settings.botAvatar')}>
            <AvatarPicker
              value={local.botAvatar}
              onChange={(v) => setLocal((l) => ({ ...l, botAvatar: v }))}
              shape="circle"
            />
          </Field>

          <Field label={t('settings.metadata')} error={metaError}>
            <textarea
              value={metaRaw}
              onChange={(e) => { setMetaRaw(e.target.value); setMetaError('') }}
              rows={2}
              className="input-field font-mono text-xs resize-none"
              placeholder="{}"
            />
          </Field>

          {/* ── Toggles ── */}
          <div className="space-y-2">
            <Toggle label={t('settings.streaming')} checked={local.streaming ?? false}
              onChange={(v) => setLocal((l) => ({ ...l, streaming: v }))} />
            <Toggle label={t('settings.welcomeScreen')} checked={local.showWelcomeScreen ?? true}
              onChange={(v) => setLocal((l) => ({ ...l, showWelcomeScreen: v }))} />
            <Toggle label={t('settings.sidebar')} checked={local.showSidebar ?? false}
              onChange={(v) => setLocal((l) => ({ ...l, showSidebar: v }))} />
            <Toggle label={t('settings.fileUploads')} checked={local.allowFileUploads ?? false}
              onChange={(v) => setLocal((l) => ({ ...l, allowFileUploads: v }))} />
          </div>

          {/* ── Mode ── */}
          <Field label={t('settings.mode')}>
            <div className="flex gap-2">
              {(['fullscreen', 'window', 'mixed'] as const).map((m) => (
                <button key={m} onClick={() => setLocal((l) => ({ ...l, mode: m }))}
                  className="flex-1 py-1.5 rounded-lg text-sm capitalize transition-colors"
                  style={local.mode === m
                    ? { background: 'var(--t-accent)', color: 'var(--t-accent-fg)' }
                    : { background: 'var(--t-bg-surface2)', color: 'var(--t-fg-secondary)' }
                  }
                >{m}</button>
              ))}
            </div>
          </Field>

          {(local.mode === 'fullscreen' || local.mode === 'mixed') && (
            <div className="space-y-3 pl-3 border-l-2" style={{ borderColor: 'var(--t-accent)' }}>
              <Toggle label={t('settings.fullscreenSheet')} checked={local.fullscreenSheet ?? false}
                onChange={(v) => setLocal((l) => ({ ...l, fullscreenSheet: v }))} />
              {local.fullscreenSheet && (
                <Field label={t('settings.fullscreenSheetHeight')}>
                  <input
                    value={local.fullscreenSheetHeight ?? '75vh'}
                    onChange={(e) => setLocal((l) => ({ ...l, fullscreenSheetHeight: e.target.value || undefined }))}
                    placeholder="75vh"
                    className="input-field"
                  />
                </Field>
              )}
            </div>
          )}

          {local.mode === 'window' && (
            <div className="space-y-3 pl-3 border-l-2" style={{ borderColor: 'var(--t-accent)' }}>
              <Toggle label={t('settings.cta')} checked={local.showCta ?? true}
                onChange={(v) => setLocal((l) => ({ ...l, showCta: v }))} />
              <Toggle label={t('settings.ctaSound')} checked={local.ctaSound ?? true}
                onChange={(v) => setLocal((l) => ({ ...l, ctaSound: v }))} />
              <Field label={t('settings.ctaDelay')}>
                <input type="number" value={local.ctaDelay ?? 5000}
                  onChange={(e) => setLocal((l) => ({ ...l, ctaDelay: Number(e.target.value) }))}
                  className="input-field" min={0} step={500} />
              </Field>
              <Field label={t('settings.toggleButtonIcon')}>
                <AvatarPicker
                  value={local.toggleButtonIcon}
                  onChange={(v) => setLocal((l) => ({ ...l, toggleButtonIcon: v }))}
                  shape="circle"
                />
              </Field>
            </div>
          )}

          <hr style={{ borderColor: 'var(--t-bg-border)' }} />

          {/* ── "Powered by" footer ── */}
          <Toggle
            label={t('settings.poweredByHide')}
            checked={local.poweredByHide ?? false}
            onChange={(v) => setLocal((l) => ({ ...l, poweredByHide: v }))}
          />
          {!local.poweredByHide && (
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('settings.poweredByLabel')}>
                <input
                  value={local.poweredByLabel ?? ''}
                  onChange={(e) => setLocal((l) => ({ ...l, poweredByLabel: e.target.value || undefined }))}
                  placeholder="ELIA AI Assistant"
                  className="input-field"
                />
              </Field>
              <Field label={t('settings.poweredByUrl')}>
                <input
                  type="url"
                  value={local.poweredByUrl ?? ''}
                  onChange={(e) => setLocal((l) => ({ ...l, poweredByUrl: e.target.value || undefined }))}
                  placeholder="https://www.elia-asistent.com"
                  className="input-field"
                />
              </Field>
            </div>
          )}

          <hr style={{ borderColor: 'var(--t-bg-border)' }} />

          {/* ── Per-language content ── */}
          <div>
            <p className="text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-3">
              {t('settings.perLanguage')}
            </p>

            {/* Language tabs */}
            <div className="flex flex-wrap gap-1 mb-4">
              {allLangTabs.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLangTab(lang)}
                  className="px-3 py-1 rounded-lg text-xs font-medium uppercase transition-colors"
                  style={
                    activeLangTab === lang
                      ? { background: 'var(--t-accent)', color: 'var(--t-accent-fg)' }
                      : { background: 'var(--t-bg-surface2)', color: 'var(--t-fg-secondary)' }
                  }
                >
                  {lang}
                </button>
              ))}

              {/* Add language */}
              {showAddLang ? (
                <div className="flex gap-1 items-center">
                  <select
                    value={newLangCode}
                    onChange={(e) => setNewLangCode(e.target.value)}
                    className="input-field py-1 text-xs"
                    style={{ width: 'auto' }}
                  >
                    <option value="">Pick…</option>
                    {KNOWN_LANGS.filter((l) => !allLangTabs.includes(l.code)).map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                    <option value="__custom">Custom code…</option>
                  </select>
                  {newLangCode === '__custom' && (
                    <input
                      placeholder="e.g. fr"
                      maxLength={5}
                      className="input-field py-1 text-xs w-20"
                      onChange={(e) => setNewLangCode(e.target.value)}
                    />
                  )}
                  <button onClick={handleAddLang}
                    className="px-2 py-1 rounded-lg text-xs transition-colors"
                    style={{ background: 'var(--t-accent)', color: 'var(--t-accent-fg)' }}>
                    Add
                  </button>
                  <button onClick={() => setShowAddLang(false)}
                    className="px-2 py-1 rounded-lg text-xs text-fg-muted hover:text-fg-primary">
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddLang(true)}
                  className="px-3 py-1 rounded-lg text-xs text-fg-muted hover:text-fg-primary hover:bg-bg-surface2 transition-colors"
                >
                  + {t('settings.addLanguage')}
                </button>
              )}
            </div>

            {/* Per-language fields */}
            <div className="space-y-3">
              <Field label={t('settings.botNameOverride')}>
                <input
                  value={activeLangData.botName ?? ''}
                  onChange={(e) => setLangData(activeLangTab, { botName: e.target.value || undefined })}
                  placeholder={local.botName ?? 'Assistant'}
                  className="input-field"
                />
              </Field>

              <Field label={t('settings.welcomeSubtitle')}>
                <input
                  value={activeLangData.welcomeSubtitle ?? ''}
                  onChange={(e) => setLangData(activeLangTab, { welcomeSubtitle: e.target.value || undefined })}
                  placeholder={t('welcome.subtitle')}
                  className="input-field"
                />
              </Field>

              <Field label={t('settings.initialMessages')}>
                <textarea
                  value={(activeLangData.initialMessages ?? []).join('\n')}
                  onChange={(e) =>
                    setLangData(activeLangTab, {
                      initialMessages: e.target.value
                        ? e.target.value.split('\n').filter(Boolean)
                        : [],
                    })
                  }
                  rows={4}
                  className="input-field resize-none text-sm"
                  placeholder={t('settings.initialMessagesPlaceholder')}
                />
              </Field>

              {local.mode === 'window' && (
                <Field label={t('settings.ctaTextLabel')}>
                  <input
                    value={activeLangData.ctaText ?? ''}
                    onChange={(e) => setLangData(activeLangTab, { ctaText: e.target.value || undefined })}
                    placeholder={local.ctaText ?? 'Hi! How can I help you today?'}
                    className="input-field"
                  />
                </Field>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Footer */}
        <div
          className="flex justify-between gap-2 px-6 py-4 border-t flex-shrink-0"
          style={{ borderColor: 'var(--t-bg-border)' }}
        >
          {showExport ? (
            <>
              <button onClick={() => setShowExport(false)}
                className="px-4 py-2 rounded-lg text-sm text-fg-secondary hover:text-fg-primary hover:bg-bg-surface2 transition-colors">
                ← Back
              </button>
              <button onClick={handleCopy}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'var(--t-accent)', color: 'var(--t-accent-fg)' }}>
                {copied ? '✓ Copied' : 'Copy to clipboard'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setShowExport(true)}
                className="px-4 py-2 rounded-lg text-sm text-fg-secondary hover:text-fg-primary hover:bg-bg-surface2 transition-colors">
                Export config
              </button>
              <div className="flex gap-2">
                <button onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm text-fg-secondary hover:text-fg-primary hover:bg-bg-surface2 transition-colors">
                  {t('settings.cancel')}
                </button>
                <button onClick={handleSave}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: 'var(--t-accent)', color: 'var(--t-accent-fg)' }}>
                  {t('settings.save')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          background: var(--t-bg-surface2);
          color: var(--t-fg-primary);
          border: 1px solid var(--t-bg-border);
          outline: none;
          transition: border-color 0.15s;
        }
        .input-field:focus { border-color: var(--t-accent); }
      `}</style>
    </div>
  )
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-fg-secondary">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

function Toggle({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div className="relative w-9 h-5 rounded-full transition-colors"
        style={{ background: checked ? 'var(--t-accent)' : 'var(--t-bg-surface2)' }}
        onClick={() => onChange(!checked)}>
        <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow"
          style={{ left: checked ? '18px' : '2px' }} />
      </div>
      <span className="text-sm text-fg-secondary">{label}</span>
    </label>
  )
}

function AvatarPicker({
  value,
  onChange,
  shape,
}: {
  value: string | undefined
  onChange: (v: string | undefined) => void
  shape: 'circle' | 'square'
}) {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState('')
  const previewUrl = resolveAvatarUrl(value)
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-lg'

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError(t('settings.avatarErrorType'))
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError(t('settings.avatarErrorSize'))
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        onChange(result)
        setUploadError('')
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-3">
      {/* Preview + clear */}
      <div className="flex items-center gap-3">
        <div
          className={`w-14 h-14 ${radius} overflow-hidden flex items-center justify-center text-xs`}
          style={{
            background: 'var(--t-bg-surface2)',
            color: 'var(--t-fg-muted)',
            border: '1px solid var(--t-bg-border)',
          }}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            t('settings.avatarNone')
          )}
        </div>
        {value && (
          <button
            type="button"
            onClick={() => { onChange(undefined); setUploadError('') }}
            className="px-2 py-1 rounded-lg text-xs text-fg-muted hover:text-fg-primary hover:bg-bg-surface2 transition-colors"
          >
            {t('settings.avatarClear')}
          </button>
        )}
      </div>

      {/* Built-in grid */}
      <div className="grid grid-cols-6 gap-2">
        {builtInAvatarIds.map((id) => {
          const selected = value === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => { onChange(id); setUploadError('') }}
              className={`${radius} overflow-hidden transition-transform hover:scale-105`}
              style={{
                outline: selected ? '2px solid var(--t-accent)' : '1px solid var(--t-bg-border)',
                outlineOffset: selected ? '1px' : '0',
              }}
              title={id}
            >
              <img src={builtInAvatars[id]} alt={id} className="w-full aspect-square object-cover" />
            </button>
          )
        })}
      </div>

      {/* Upload + URL */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="px-3 py-1.5 rounded-lg text-xs transition-colors"
          style={{ background: 'var(--t-bg-surface2)', color: 'var(--t-fg-secondary)' }}
        >
          {t('settings.avatarUpload')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            e.target.value = ''
          }}
        />
        <input
          type="url"
          placeholder={t('settings.avatarUrlPlaceholder')}
          value={value && !(value in builtInAvatars) && !value.startsWith('data:') ? value : ''}
          onChange={(e) => {
            const v = e.target.value.trim()
            onChange(v || undefined)
            setUploadError('')
          }}
          className="input-field flex-1 text-xs"
        />
      </div>

      {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
    </div>
  )
}
