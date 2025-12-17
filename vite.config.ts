import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')

  // Validate required environment variables
  const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
  const missing = requiredEnvVars.filter(key => !env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Mode: ${mode}\n` +
      `Expected file: .env.${mode}`
    )
  }

  console.log(`\n🚀 Running in ${mode.toUpperCase()} mode`)
  console.log(`📡 Supabase URL: ${env.VITE_SUPABASE_URL}\n`)

  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Make mode available at runtime (optional, for debugging)
      __APP_MODE__: JSON.stringify(mode),
    },
  }
})
