import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode = 'test' }) => {
  // Load test environment variables
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/tests/setup.ts'],
      env: {
        // Inject environment variables into tests
        VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY,
        TEST_USER_EMAIL: env.TEST_USER_EMAIL,
        TEST_USER_PASSWORD: env.TEST_USER_PASSWORD,
        TEST_ADMIN_EMAIL: env.TEST_ADMIN_EMAIL,
        TEST_ADMIN_PASSWORD: env.TEST_ADMIN_PASSWORD,
      },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        'dist/',
        'supabase/',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      exclude: [
        'node_modules',
        'dist',
        '.idea',
        '.git',
        '.cache',
        'src/tests/e2e/**', // E2E tests run with Playwright, not Vitest
        'src/tests/integration/auth-flow.test.tsx', // Has circular dependency with mocks, covered by E2E
        'src/tests/unit/RoleContext.test.tsx', // Has circular dependency with mocks, covered by E2E
      ],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
