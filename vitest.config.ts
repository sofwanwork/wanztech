/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      // The real `server-only` package throws when imported outside an RSC.
      // For Vitest (Node) we map it to an empty stub so files that mark
      // themselves server-only can still be imported in unit tests.
      'server-only': path.resolve(__dirname, './tests/__mocks__/server-only.ts'),
    },
  },
});
