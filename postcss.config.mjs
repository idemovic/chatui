export default {
  plugins: {
    "@tailwindcss/postcss": {},
    "postcss-prefix-selector": {
      prefix: ".chat-ui",
      transform(prefix, selector, prefixedSelector) {
        if (selector.startsWith(".chat-ui")) {
          return selector;
        }

        if (selector === ':root') {
          return '.chat-ui';
        }

        return prefixedSelector;
      },
    },
  },
};
