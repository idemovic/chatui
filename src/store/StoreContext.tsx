import { createContext, useContext, type ReactNode } from 'react'
import type { StoreApi, UseBoundStore } from 'zustand'
import type { SettingsState } from './settingsStore.ts'
import type { ChatState } from './chatStore.ts'

export type SettingsStoreHook = UseBoundStore<StoreApi<SettingsState>>
export type ChatStoreHook = UseBoundStore<StoreApi<ChatState>>

const SettingsStoreContext = createContext<SettingsStoreHook | null>(null)
const ChatStoreContext = createContext<ChatStoreHook | null>(null)
const StorageNamespaceContext = createContext<string | undefined>(undefined)

/**
 * Provides one createChat() instance's settings/chat stores to its React tree. Each mounted
 * instance gets its own stores (created in createChat.tsx) so multiple widgets on the same
 * page - e.g. a host's own floating widget alongside a page's embedded demo - never share
 * config, theme, or conversation state.
 *
 * `storageNamespace` is the same value the stores were created with, exposed here for the
 * component-local storage keys that don't live in a store (see useStorageNamespace).
 */
export function StoreProvider({
  settingsStore,
  chatStore,
  storageNamespace,
  children,
}: {
  settingsStore: SettingsStoreHook
  chatStore: ChatStoreHook
  storageNamespace?: string
  children: ReactNode
}) {
  return (
    <StorageNamespaceContext.Provider value={storageNamespace}>
      <SettingsStoreContext.Provider value={settingsStore}>
        <ChatStoreContext.Provider value={chatStore}>{children}</ChatStoreContext.Provider>
      </SettingsStoreContext.Provider>
    </StorageNamespaceContext.Provider>
  )
}

/**
 * This instance's storage namespace, for keys written outside the zustand stores. Pair it with
 * scopedKey() - a bare key would be shared with every other instance on the page.
 */
export function useStorageNamespace(): string | undefined {
  return useContext(StorageNamespaceContext)
}

export function useSettingsStore(): SettingsState
export function useSettingsStore<T>(selector: (state: SettingsState) => T): T
export function useSettingsStore<T>(selector?: (state: SettingsState) => T) {
  const store = useContext(SettingsStoreContext)
  if (!store) throw new Error('useSettingsStore must be used within a <StoreProvider>')
  return selector ? store(selector) : store()
}

export function useChatStore(): ChatState
export function useChatStore<T>(selector: (state: ChatState) => T): T
export function useChatStore<T>(selector?: (state: ChatState) => T) {
  const store = useContext(ChatStoreContext)
  if (!store) throw new Error('useChatStore must be used within a <StoreProvider>')
  return selector ? store(selector) : store()
}

/** Imperative access (outside render, e.g. inside a callback) to the current chat store. */
export function useChatStoreApi(): ChatStoreHook {
  const store = useContext(ChatStoreContext)
  if (!store) throw new Error('useChatStoreApi must be used within a <StoreProvider>')
  return store
}
