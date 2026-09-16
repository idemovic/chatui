import tailwindcss from "@tailwindcss/postcss";
import prefixSelector from "postcss-prefix-selector";

// rem resolves against the host page's <html> font-size even inside the shadow DOM,
// so a host with e.g. `html { font-size: 62.5% }` would shrink the whole widget.
// Convert rem to px (16px base) to make sizes independent of the host page.
const remToPx = {
  postcssPlugin: "rem-to-px",
  Declaration(decl) {
    if (decl.value.includes("rem")) {
      decl.value = decl.value.replace(/(\d*\.?\d+)rem\b/g, (_, n) => `${parseFloat(n) * 16}px`);
    }
  },
};

export default {
  plugins: [
    tailwindcss(),
    prefixSelector({
      prefix: ".chat-ui",
      includeFiles: [/src[\\/]index\.css$/],
      transform(prefix, selector, prefixedSelector) {
        if (selector.startsWith(".chat-ui")) {
          return selector;
        }

        if (selector === ':root') {
          return '.chat-ui';
        }

        return prefixedSelector;
      },
    }),
    remToPx,
  ],
};
