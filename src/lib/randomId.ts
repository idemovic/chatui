/**
 * Returns 128 random bits as 32 hex characters. A session id is the only thing that binds a
 * visitor to their conversation (it becomes `messages.sender` and the SSE token subject), so it
 * must not be guessable. crypto.getRandomValues rather than crypto.randomUUID because the latter
 * only exists in secure contexts, and the widget can be embedded on plain-HTTP host pages.
 */
export function randomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
