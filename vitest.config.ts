import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'src/**/*.test.{ts,tsx}',
      'src/**/*.spec.{ts,tsx}',
      'src/**/__tests__/**/*.test.{ts,tsx}',
      'src/**/__tests__/**/*.spec.{ts,tsx}',
    ],
    exclude: ['tests/**', 'node_modules']
  }
});
