/**
 * Builds a per-instance storage key. Every localStorage/sessionStorage key the widget writes
 * must go through here: two createChat() instances on the same page share one Storage object,
 * so an un-scoped key silently bleeds state between them. Omitting `namespace` keeps the bare
 * key, which is the pre-multi-instance behaviour existing single-widget installs persist under.
 */
export function scopedKey(base: string, namespace?: string): string {
  return namespace ? `${base}-${namespace}` : base
}
