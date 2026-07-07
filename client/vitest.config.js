import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 120000,
    hookTimeout: 60000,
    globalSetup: ['tests/global-setup.mjs'],
    globalTeardown: ['tests/global-teardown.mjs'],
    include: ['tests/**/*.test.mjs', 'tests/**/*.test.js']
  }
});
