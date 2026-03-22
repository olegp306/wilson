import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@wilson/event-contracts': path.resolve(root, 'packages/event-contracts/src/index.ts'),
      '@wilson/db': path.resolve(root, 'packages/db/src/index.ts'),
      '@wilson/shared-types': path.resolve(root, 'packages/shared-types/src/index.ts'),
      '@wilson/logger': path.resolve(root, 'packages/logger/src/index.ts'),
      '@wilson/config': path.resolve(root, 'packages/config/src/index.ts'),
      '@wilson/integration-sdk': path.resolve(root, 'packages/integration-sdk/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['packages/**/*.test.ts', 'tests/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
