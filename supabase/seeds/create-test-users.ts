import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load .env.test
dotenv.config({ path: '.env.test' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY
const testUserEmail = process.env.TEST_USER_EMAIL
const testUserPassword = process.env.TEST_USER_PASSWORD
const adminEmail = process.env.TEST_ADMIN_EMAIL
const adminPassword = process.env.TEST_ADMIN_PASSWORD

// Validate environment variables
if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing required environment variables')
  console.error('Required: VITE_SUPABASE_URL, TEST_SUPABASE_SERVICE_ROLE_KEY')
  console.error('Please add TEST_SUPABASE_SERVICE_ROLE_KEY to .env.test')
  console.error('Get it from: Supabase Dashboard > Settings > API > service_role key')
  process.exit(1)
}

if (!testUserEmail || !testUserPassword || !adminEmail || !adminPassword) {
  console.error('❌ Error: Missing test user credentials in .env.test')
  console.error('Required: TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD')
  process.exit(1)
}

// Admin client (bypasses RLS)
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUsers() {
  console.log('🚀 Creating test users in Supabase Auth...')
  console.log(`📡 Supabase URL: ${supabaseUrl}`)
  console.log('')

  try {
    // Delete existing test users if they exist (idempotent)
    console.log('🔍 Checking for existing test users...')
    const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers()

    if (listError) {
      console.error('❌ Error listing users:', listError.message)
      throw listError
    }

    const usersToDelete = existingUsers.users.filter(
      user => user.email === testUserEmail || user.email === adminEmail
    )

    if (usersToDelete.length > 0) {
      console.log(`🗑️  Deleting ${usersToDelete.length} existing test user(s)...`)
      for (const user of usersToDelete) {
        await adminClient.auth.admin.deleteUser(user.id)
        console.log(`   Deleted: ${user.email}`)
      }
    } else {
      console.log('   No existing test users found')
    }

    console.log('')

    // Create regular user
    console.log('👤 Creating regular test user...')
    const { data: regularUser, error: regularError } =
      await adminClient.auth.admin.createUser({
        email: testUserEmail,
        password: testUserPassword,
        email_confirm: true,
        app_metadata: { is_admin: false },
        user_metadata: { full_name: 'Test User' }
      })

    if (regularError) {
      console.error('❌ Error creating regular user:', regularError.message)
      throw regularError
    }
    console.log(`✅ Created regular user: ${regularUser.user.email}`)
    console.log(`   User ID: ${regularUser.user.id}`)

    // Create admin user
    console.log('')
    console.log('👨‍💼 Creating admin test user...')
    const { data: adminUser, error: adminError } =
      await adminClient.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        app_metadata: { is_admin: true },
        user_metadata: { full_name: 'Admin User' }
      })

    if (adminError) {
      console.error('❌ Error creating admin user:', adminError.message)
      throw adminError
    }
    console.log(`✅ Created admin user: ${adminUser.user.email}`)
    console.log(`   User ID: ${adminUser.user.id}`)

    // Create profiles
    console.log('')
    console.log('📋 Creating user profiles...')
    const { error: profileError } = await adminClient.from('profiles').upsert([
      {
        id: regularUser.user.id,
        role: 'user',
        full_name: 'Test User'
      },
      {
        id: adminUser.user.id,
        role: 'admin',
        full_name: 'Admin User'
      }
    ], { onConflict: 'id' })

    if (profileError) {
      console.error('❌ Error creating profiles:', profileError.message)
      throw profileError
    }
    console.log('✅ Created profiles for both users')

    console.log('')
    console.log('🎉 Test users setup complete!')
    console.log('')
    console.log('Next step: Run database seed with:')
    console.log('  supabase db reset')
    console.log('')

  } catch (error) {
    console.error('')
    console.error('❌ Fatal error during user creation:')
    console.error(error)
    process.exit(1)
  }
}

// Run the script
createTestUsers()
