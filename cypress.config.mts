import { defineConfig } from "cypress";

export default defineConfig({
  env: {
    TARGET: "staging",
  },
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    includeShadowDom: true,
  },
});
