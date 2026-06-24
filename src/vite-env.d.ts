/// <reference types="vite/client" />

declare module 'virtual:css-injected-by-js' {
  export function injectCSS(options?: { target?: ShadowRoot | Document }): void
  export function removeCSS(): void
  export function getRawCSS(): string
}
