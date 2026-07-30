import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['unit/**/*.spec.js'],
    environment: 'jsdom',
  },
});
