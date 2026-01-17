import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vitest/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: ['node_modules', 'dist', 'tests/e2e/**'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{vite,vitest,tailwind,postcss,eslint}.config.*',
        // Exclude index files (re-exports)
        '**/index.ts',
        '**/index.tsx',
        // Exclude entry points
        'src/main.tsx',
        'src/App.tsx',
        'src/vite-env.d.ts',
        // Exclude type definition files
        'src/types/**',
        // Exclude test files from coverage
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
