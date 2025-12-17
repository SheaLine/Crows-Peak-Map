# Environment Setup Guide

This guide explains how to work with different environments (development, test) in the Crows Peak Map application.

## Overview

The application uses Vite's built-in mode system to switch between environments:
- **Development Mode**: Uses `.env.development` → Connects to main Supabase project (jlmldfkrjqlwhfbnxzzu)
- **Test Mode**: Uses `.env.test` → Connects to test Supabase project (jxxoloziwfskksysxphe)

---

## Quick Start

### Development (Main Supabase)
```bash
npm run dev              # Start dev server with main Supabase
```

### Test Environment
```bash
npm run dev:test         # Start dev server with test Supabase
```

### Running Tests
```bash
npm run test             # Unit tests (automatically uses test env)
npm run test:e2e         # E2E tests (automatically uses test env)
npm run test:all         # All tests
```

---

## Environment Files

### `.env.development`
Main development environment. Contains credentials for your primary Supabase project.

```env
# Development Environment - Main Supabase Project
VITE_SUPABASE_URL=https://jlmldfkrjqlwhfbnxzzu.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_sIW0wutgstDBihxOY9kv1w_kaNQbUuN
VITE_MAPBOX_TOKEN=your-mapbox-token
VITE_ENV_NAME=development
```

### `.env.test`
Test environment. Contains credentials for your test Supabase project.

```env
# Test Environment - Test Supabase Project
VITE_SUPABASE_URL=https://jxxoloziwfskksysxphe.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_XQAMeSzc32FognBMJrIPRw_u__4ro5u

# Test User Credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123
TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=adminpassword123

VITE_ENV_NAME=test
```

### `.env.example`
Template for other developers. Copy this to create your own environment files.

---

## Available Commands

### Development Commands

| Command | Environment | Description |
|---------|------------|-------------|
| `npm run dev` | Development | Start dev server with main Supabase |
| `npm run dev:test` | Test | Start dev server with test Supabase |
| `npm run build` | Production | Build for production |
| `npm run build:dev` | Development | Build with development config |
| `npm run build:test` | Test | Build with test config |
| `npm run preview` | Development | Preview production build (dev env) |
| `npm run preview:test` | Test | Preview production build (test env) |

### Test Commands

| Command | Environment | Description |
|---------|------------|-------------|
| `npm run test` | Test | Run unit tests |
| `npm run test:unit` | Test | Run unit tests with verbose output |
| `npm run test:security` | Test | Run security tests only |
| `npm run test:coverage` | Test | Run tests with coverage report |
| `npm run test:watch` | Test | Run tests in watch mode |
| `npm run test:e2e` | Test | Run E2E tests (headless) |
| `npm run test:e2e:ui` | Test | Run E2E tests in UI mode |
| `npm run test:e2e:headed` | Test | Run E2E tests with visible browser |
| `npm run test:all` | Test | Run all tests (unit + security + e2e) |

### Supabase Commands

| Command | Description |
|---------|-------------|
| `npm run supabase:link:prod` | Link CLI to production Supabase project |
| `npm run supabase:link:test` | Link CLI to test Supabase project |
| `npm run gen:types` | Generate TypeScript types from Supabase schema |
| `npm run migrate:dev` | Apply migrations and regenerate types |

---

## How It Works

### Vite Mode System

When you run a command with `--mode` flag, Vite automatically:
1. Loads the corresponding `.env.{mode}` file
2. Makes variables prefixed with `VITE_` available in your code
3. Validates required environment variables

Example:
```bash
npm run dev              # Loads .env.development
npm run dev:test         # Loads .env.test
npm run build            # Loads .env.production (fallback to .env)
```

### Environment Detection

When you start the dev server or build, you'll see:

**Development Mode:**
```
🚀 Running in DEVELOPMENT mode
📡 Supabase URL: https://jlmldfkrjqlwhfbnxzzu.supabase.co
```

**Test Mode:**
```
🚀 Running in TEST mode
📡 Supabase URL: https://jxxoloziwfskksysxphe.supabase.co
```

This confirmation appears in your terminal to ensure you're connected to the correct environment.

---

## Switching Environments

### While Developing

To switch from development to test environment:

1. **Stop your current dev server** (Ctrl+C)
2. **Run the test command:**
   ```bash
   npm run dev:test
   ```
3. **Verify the console output** shows TEST mode
4. **Access the app** at http://localhost:5173

To switch back to development:
1. **Stop the test server** (Ctrl+C)
2. **Run the dev command:**
   ```bash
   npm run dev
   ```
3. **Verify the console output** shows DEVELOPMENT mode

### For Testing

Tests **automatically** use the test environment:
- Unit tests load `.env.test` via `--mode test` flag
- E2E tests start dev server in test mode
- No manual switching required

---

## Setting Up for the First Time

### 1. Create Environment Files

If you don't have `.env.development` yet:

```bash
# Copy the example
cp .env.example .env.development

# Edit with your development Supabase credentials
# Replace placeholder values with actual credentials
```

For test environment:
```bash
# .env.test should already exist
# Verify it has your test Supabase credentials
```

### 2. Verify Credentials

**Development:**
- Supabase URL: `https://jlmldfkrjqlwhfbnxzzu.supabase.co`
- Get anon key from: [Supabase Dashboard > Settings > API](https://supabase.com/dashboard/project/jlmldfkrjqlwhfbnxzzu/settings/api)

**Test:**
- Supabase URL: `https://jxxoloziwfskksysxphe.supabase.co`
- Get anon key from: [Supabase Dashboard > Settings > API](https://supabase.com/dashboard/project/jxxoloziwfskksysxphe/settings/api)

### 3. Test the Setup

```bash
# Test development environment
npm run dev
# Should show: "Running in DEVELOPMENT mode"

# Stop server (Ctrl+C), then test test environment
npm run dev:test
# Should show: "Running in TEST mode"

# Run tests to verify test environment works
npm run test:unit
```

---

## GitHub Actions CI/CD

### Required Secrets

Configure these in **GitHub Repository Settings > Secrets and variables > Actions**:

**Test Environment:**
- `TEST_SUPABASE_URL` - Test Supabase URL (https://jxxoloziwfskksysxphe.supabase.co)
- `TEST_SUPABASE_ANON_KEY` - Test Supabase anon key
- `TEST_USER_EMAIL` - Test user email
- `TEST_USER_PASSWORD` - Test user password
- `TEST_ADMIN_EMAIL` - Test admin email
- `TEST_ADMIN_PASSWORD` - Test admin password

**Production Environment:**
- `PROD_SUPABASE_URL` - Production Supabase URL (https://jlmldfkrjqlwhfbnxzzu.supabase.co)
- `PROD_SUPABASE_ANON_KEY` - Production Supabase anon key

**Deployment:**
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

**Optional:**
- `SNYK_TOKEN` - Snyk security scanning token

### CI/CD Behavior

**Tests** (unit, security, E2E):
- Use `TEST_SUPABASE_URL` and `TEST_SUPABASE_ANON_KEY`
- Run against test database
- Never touch production data

**Production Build:**
- Uses `PROD_SUPABASE_URL` and `PROD_SUPABASE_ANON_KEY`
- Deployed to Vercel
- Only runs on push to `main` branch

---

## Troubleshooting

### Error: Missing required environment variables

**Problem:**
```
Missing required environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
Mode: development
Expected file: .env.development
```

**Solution:**
1. Ensure `.env.development` file exists in project root
2. Check file contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Verify values are not empty
4. Restart dev server

### Tests failing with connection errors

**Problem:**
Tests can't connect to Supabase or get authentication errors.

**Solution:**
1. Verify `.env.test` exists and has correct credentials
2. Check test Supabase project is running
3. Ensure test users exist in test Supabase project:
   - Regular user: `test@example.com`
   - Admin user: `admin@example.com`
4. Verify RLS policies allow test operations

### Wrong environment connected

**Problem:**
You're running `npm run dev` but connecting to test database, or vice versa.

**Solution:**
1. Stop the dev server (Ctrl+C)
2. Check console output when starting - it should show which mode
3. Run correct command:
   - Development: `npm run dev`
   - Test: `npm run dev:test`
4. Verify console shows correct Supabase URL

### GitHub Actions failing

**Problem:**
CI/CD pipeline fails with environment variable errors.

**Solution:**
1. Check GitHub Secrets are configured:
   - Go to Repository Settings > Secrets and variables > Actions
   - Verify all required secrets exist (see list above)
2. Check secret names match exactly (case-sensitive):
   - `TEST_SUPABASE_URL` not `test_supabase_url`
3. Verify secret values are correct (no extra spaces)
4. Re-run failed workflow

---

## Best Practices

### 1. Never Commit Environment Files

`.env`, `.env.development`, `.env.test`, and `.env.production` are all in `.gitignore`.

**Never commit these files!** They contain sensitive credentials.

### 2. Use Test Environment for Development Testing

If you're testing new features that might corrupt data:

```bash
npm run dev:test  # Use test database instead of main
```

This protects your main development data.

### 3. Always Run Tests in Test Environment

Tests automatically use test environment, but verify:

```bash
npm run test      # Should load .env.test
npm run test:e2e  # Should start server in test mode
```

Never run tests against production!

### 4. Keep .env.example Updated

When adding new environment variables:

1. Add to `.env.development` with real value
2. Add to `.env.example` with placeholder
3. Commit `.env.example` (safe, no secrets)
4. Document in this file

### 5. Verify Environment Before Important Operations

Before database migrations, data imports, or other risky operations:

1. Check console output shows correct mode
2. Verify Supabase URL in console
3. Double-check you're in the right environment

---

## Additional Resources

- [Vite Environment Variables Documentation](https://vite.dev/guide/env-and-mode.html)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

## Support

If you encounter issues with environment switching:

1. Check this documentation
2. Verify environment files exist and are correct
3. Check console output for which mode is active
4. Try stopping and restarting dev server
5. Check GitHub Actions logs for CI/CD issues

---

**Last Updated:** 2025-01-12
**Environment System Version:** 1.0
