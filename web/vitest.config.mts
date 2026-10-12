import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      // The real package throws outside a React Server Components build; tests import server code directly.
      "server-only": fileURLToPath(new URL("./lib/server/test-server-only.ts", import.meta.url)),
    },
  },
  // Files run one at a time: each fork suite starts its own anvil fork, and several at once fetching
  // state from the public RPC can time out.
  test: { environment: "node", include: ["lib/**/*.test.ts"], testTimeout: 30_000, fileParallelism: false },
});
