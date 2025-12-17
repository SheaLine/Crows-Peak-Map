import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

// ES module equivalents of __filename and __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env.test
dotenv.config({ path: '.env.test' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables
if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing required environment variables')
  console.error('Required: VITE_SUPABASE_URL, TEST_SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Admin client (bypasses RLS)
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runSeedSQL() {
  console.log('📋 Next step: Manual SQL Seeding')
  console.log('')
  console.log('The Supabase JS client cannot execute raw SQL against remote databases.')
  console.log('Please complete the seeding manually:')
  console.log('')
  console.log('  1. Open: https://supabase.com/dashboard/project/jxxoloziwfskksysxphe/sql/new')
  console.log('  2. Open file: supabase/seeds/seed.sql')
  console.log('  3. Copy the entire contents')
  console.log('  4. Paste into the SQL Editor')
  console.log('  5. Click "Run" to execute')
  console.log('')
  console.log('Expected results:')
  console.log('  ✓ 5 equipment types')
  console.log('  ✓ 15 equipment records')
  console.log('  ✓ 45 service logs')
  console.log('  ✓ 45 attachments')
  console.log('')
  console.log('After seeding, run: npm run test:e2e')
  console.log('')

  // Read and display the SQL file path for easy access
  const seedPath = path.join(__dirname, 'seed.sql')
  console.log(`💡 Seed file location: ${seedPath}`)
  console.log('')
}

// Run the script
runSeedSQL()
