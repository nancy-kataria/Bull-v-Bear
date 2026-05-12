import { defineConfig } from 'vitest/config';
import path from 'path';

// Vitest configuration file - tells vitest how to run your tests
export default defineConfig({
  test: {
    // Use jsdom for DOM-related tests (not needed for search.ts, but good for React components)
    environment: 'jsdom',
    
    // Include test files matching these patterns
    include: ['**/*.{test,spec}.{ts,tsx}'],
    
    // Exclude node_modules and build directories
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    
    // Enable globals like describe, it, expect without importing them
    globals: true,
    
    // Show detailed test output
    reporters: 'verbose',
  },
  
  // Path alias configuration (matches tsconfig.json)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
