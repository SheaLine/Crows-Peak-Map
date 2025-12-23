# Test Database Seeding

This directory contains scripts to populate the test Supabase database with dummy data for E2E testing.

## Overview

The seeding process consists of two parts:

1. **`create-test-users.ts`** - TypeScript script that creates test users in Supabase Auth
2. **`seed.sql`** - SQL script that populates database tables with test data

## Prerequisites

### 1. Get Service Role Key

You need the Supabase service role key (NOT the anon key):

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your test project: `jxxoloziwfskksysxphe`
3. Navigate to: **Settings > API**
4. Copy the **service_role** key (keep it secret!)

### 2. Add to .env.test

Add the service role key to your `.env.test` file:

```env
TEST_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ SECURITY WARNING:**
- The service_role key has FULL database access
- NEVER commit this key to git
- NEVER use it in client-side code
- Only use it in secure server environments or CI/CD

### 3. Link Supabase CLI

Link the Supabase CLI to your test project:

```bash
supabase link --project-ref jxxoloziwfskksysxphe
```

### 4. Install Dependencies

```bash
npm install
```

## Usage

### Seed the Test Database

Run this command to populate the entire test database:

```bash
npm run seed:test
```

This will:
1. Create test users (`test@example.com` and `admin@example.com`) via the TypeScript script
2. Reset the database and run all migrations
3. Execute `seed.sql` to populate tables with test data

### Just Create Users (without resetting DB)

If you only want to create/recreate the test users:

```bash
npm run seed:users
```

## What Gets Created

### Auth Users (2)

| Email | Password | Role | app_metadata.is_admin |
|-------|----------|------|----------------------|
| test@example.com | testpassword123 | user | false |
| admin@example.com | adminpassword123 | admin | true |

### Equipment Types (5)

| ID | Display Name | Icon | Color |
|----|--------------|------|-------|
| 1 | Electrical | Bolt | #FFD700 (gold) |
| 2 | Water | droplet | #1E90FF (blue) |
| 3 | Gas | flame | #FF6347 (red) |
| 4 | WiFi | Wifi | #32CD32 (green) |
| 5 | Building | building | #808080 (gray) |

### Equipment Records (15)

- 3 Electrical (transformers, panels)
- 5 Water (pumps, tanks, filters)
- 2 Gas (propane tank, generator)
- 3 WiFi (access points)
- 2 Buildings

All equipment has:
- Valid coordinates within MapScrollBoundary (Sonoma County area)
- Realistic metadata (JSONB fields like voltage, capacity, model)
- Metadata ordering arrays
- Summary descriptions

### Service Logs (45)

- 3 service logs per equipment
- Different dates (30, 60, 90 days ago)
- Tests pagination and date filtering

### Attachments (45)

- 3 attachments per equipment
- 2 images (one primary) + 1 document
- Placeholder URLs (no actual files)

## Verification

After seeding, verify the data:

### Check in Supabase Dashboard

1. Go to **Table Editor**
2. Check each table has the expected row counts:
   - `types`: 5 rows
   - `equipment`: 15 rows
   - `service_logs`: 45 rows
   - `attachments`: 45 rows
3. Go to **Auth > Users**
4. Verify 2 users exist: test@example.com and admin@example.com

### Run E2E Tests

```bash
npm run test:e2e
```

Expected result: **All 120 tests should run, 0 skipped**

## Troubleshooting

### Error: "Missing required environment variables"

**Problem:**
```
❌ Error: Missing required environment variables
Required: VITE_SUPABASE_URL, TEST_SUPABASE_SERVICE_ROLE_KEY
```

**Solution:**
1. Check that `.env.test` exists in project root
2. Verify it contains `TEST_SUPABASE_SERVICE_ROLE_KEY`
3. Make sure the key is not empty or invalid
4. Get the key from Supabase Dashboard > Settings > API

### Error: "Permission denied for table equipment"

**Problem:**
Seed script can't insert data into tables.

**Solution:**
- You're using the anon key instead of service_role key
- Verify `TEST_SUPABASE_SERVICE_ROLE_KEY` is set correctly in `.env.test`
- The service_role key bypasses RLS policies

### Error: "Supabase not linked"

**Problem:**
```
Error: No project ref detected
```

**Solution:**
Link the Supabase CLI to your test project:
```bash
supabase link --project-ref jxxoloziwfskksysxphe
```

### Error: "Cannot find module 'tsx'"

**Problem:**
Dependencies not installed.

**Solution:**
```bash
npm install
```

### Equipment Not Visible on Map

**Problem:**
Equipment records exist but don't show on the map.

**Solution:**
1. Check coordinates are within MapScrollBoundary bounds:
   - Latitude: 38.515 to 38.525
   - Longitude: -123.090 to -123.067
2. Verify equipment has valid `type_id` referencing the `types` table
3. Check that type icons match names in `src/data/icons.tsx` IconMap

### Tests Still Skipping

**Problem:**
E2E tests still skip after seeding.

**Solution:**
1. Verify test users were created in Supabase Auth
2. Check that `.env.test` credentials match the created users
3. Ensure equipment data exists in the database
4. Run seeding again: `npm run seed:test`

## File Structure

```
supabase/
└── seeds/
    ├── README.md              # This file
    ├── create-test-users.ts   # Auth user creation script
    └── seed.sql               # Table data seed script
```

## CI/CD Integration

The seeding is automatically run in GitHub Actions before E2E tests:

```yaml
- name: Seed test database
  run: npm run seed:test
  env:
    VITE_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
    TEST_SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_ROLE_KEY }}
    # ... other secrets
```

**Required GitHub Secrets:**
- `TEST_SUPABASE_URL`
- `TEST_SUPABASE_SERVICE_ROLE_KEY` (**add this to GitHub repo secrets**)
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`
- `TEST_ADMIN_EMAIL`
- `TEST_ADMIN_PASSWORD`

## Resetting the Database

To completely wipe and reseed the test database:

```bash
npm run seed:test
```

This is safe to run multiple times - it's idempotent.

## Development Tips

### Modify Seed Data

Edit `seed.sql` to change:
- Equipment names, descriptions, metadata
- Coordinate locations
- Service log content
- Attachment configurations

After editing, reseed:
```bash
npm run seed:test
```

### Add More Equipment Types

1. Add icon to `src/data/icons.tsx` IconMap (if needed)
2. Add type to `seed.sql` INSERT statement
3. Create equipment records with new `type_id`
4. Reseed database

### Change Test User Credentials

1. Update `.env.test` with new email/password
2. Rerun: `npm run seed:users`

## Further Reading

- [Supabase Seeding Documentation](https://supabase.com/docs/guides/database/seeding)
- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-listusers)
- [Environment Setup Guide](../../ENVIRONMENT_SETUP.md)
