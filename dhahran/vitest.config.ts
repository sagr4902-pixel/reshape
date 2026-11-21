import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@db': r('./db'),
      '@': r('./src'),
      // `server-only` throws outside a React Server environment; tests run in plain Node.
      'server-only': r('./tests/stubs/server-only.ts'),
    },
  },
  test: { environment: 'node', include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'], testTimeout: 20_000 },
});
