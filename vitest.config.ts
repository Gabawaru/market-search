import "dotenv/config";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    // tests/e2e est géré par Playwright (npm run test:e2e), pas par Vitest.
    exclude: ["**/node_modules/**", "tests/e2e/**"],
  },
});
