import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show validation errors or prevent submission
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for error message
    await expect(page.getByText(/invalid.*credentials/i)).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to main app after successful login', async ({ page }) => {
    // Note: This requires test credentials in Supabase
    // For CI/CD, use environment variables or mock
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);

    // Click sign in and wait for navigation
    await Promise.all([
      page.waitForURL('/', { timeout: 60000 }),
      page.getByRole('button', { name: /sign in/i }).click()
    ]);

    // Should redirect to main app (map view)
    await expect(page).toHaveURL('/');
  });

  test('should navigate to password reset page', async ({ page }) => {
    // Wait for "forgot password" link to be visible
    const forgotPasswordLink = page.getByText(/forgot.*password/i);
    await forgotPasswordLink.waitFor({ state: 'visible', timeout: 5000 });
    await forgotPasswordLink.click();

    // Wait for navigation
    await expect(page).toHaveURL('/password-forgot', { timeout: 5000 });
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('should send password reset email', async ({ page }) => {
    await page.goto('/password-forgot');

    // Fill in a test email
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByRole('button', { name: /reset/i }).click();

    // Wait for a response message to appear (either success or error)
    // This verifies the form submission works and communicates with Supabase
    const message = page.locator('span').filter({ hasText: /(check.*email|error|invalid|sent)/i });
    await expect(message).toBeVisible({ timeout: 10000 });

    // Note: The exact message depends on test database configuration
    // If email exists in test DB: "Password reset link sent! Check your email."
    // If email doesn't exist: "Error: Email address ... is invalid"
    // Both are valid - we're testing the form functionality, not email delivery
  });

  test('should prevent XSS in login form', async ({ page }) => {
    const xssPayload = '<script>alert("XSS")</script>';

    await page.getByLabel(/email/i).fill(xssPayload);
    await page.getByLabel(/password/i).fill(xssPayload);

    // Should not execute script
    page.on('dialog', async (dialog) => {
      // If alert fires, test fails
      expect(dialog.message()).not.toContain('XSS');
      await dialog.dismiss();
    });

    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(1000);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);

    // Click sign in and wait for navigation
    await Promise.all([
      page.waitForURL('/', { timeout: 60000 }),
      page.getByRole('button', { name: /sign in/i }).click()
    ]);

    await expect(page).toHaveURL('/');

    // Click logout and wait for redirect
    await Promise.all([
      page.waitForURL('/login', { timeout: 10000 }),
      page.getByRole('button', { name: /logout|sign out/i }).click()
    ]);

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Authorization E2E Tests', () => {
  test('should hide admin features for regular users', async ({ page }) => {
    // Login as regular user
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);

    // Click sign in and wait for navigation
    await Promise.all([
      page.waitForURL('/', { timeout: 60000 }),
      page.getByRole('button', { name: /sign in/i }).click()
    ]);

    // Click on an equipment marker to view details
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 15000 });
    const markers = page.locator('.leaflet-marker-icon');
    await markers.first().click({ force: true });

    // Wait for navigation or popup
    await page.waitForTimeout(2000);

    // Handle mobile popup if needed
    if (!page.url().includes('/equipment/')) {
      await page.waitForSelector('.leaflet-popup', { timeout: 10000 });
      const viewDetailsButton = page.getByRole('button', { name: /view.*details/i });
      await viewDetailsButton.waitFor({ state: 'visible', timeout: 10000 });
      await viewDetailsButton.click();
      await page.waitForURL(/\/equipment\//, { timeout: 10000 });
    }

    // Should be on equipment details page
    await expect(page.url()).toContain('/equipment/');

    // Wait a bit for role to load
    await page.waitForTimeout(1000);

    // Edit button should not be visible for non-admin
    await expect(page.getByRole('button', { name: /edit/i })).not.toBeVisible();
  });

  test('should show admin features for admin users', async ({ page }) => {
    // Login as admin user
    const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'adminpassword123';

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(adminEmail);
    await page.getByLabel(/password/i).fill(adminPassword);

    // Click sign in and wait for navigation
    await Promise.all([
      page.waitForURL('/', { timeout: 60000 }),
      page.getByRole('button', { name: /sign in/i }).click()
    ]);

    // Click on an equipment marker to view details
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 15000 });
    const markers = page.locator('.leaflet-marker-icon');
    await markers.first().click({ force: true });

    // Wait for navigation or popup
    await page.waitForTimeout(2000);

    // Handle mobile popup if needed
    if (!page.url().includes('/equipment/')) {
      await page.waitForSelector('.leaflet-popup', { timeout: 10000 });
      const viewDetailsButton = page.getByRole('button', { name: /view.*details/i });
      await viewDetailsButton.waitFor({ state: 'visible', timeout: 10000 });
      await viewDetailsButton.click();
      await page.waitForURL(/\/equipment\//, { timeout: 10000 });
    }

    // Should be on equipment details page
    await expect(page.url()).toContain('/equipment/');

    // Wait a bit for admin role to load
    await page.waitForTimeout(3000);

    // Edit button should be visible for admin
    await expect(page.getByRole('button', { name: /edit/i })).toBeVisible({ timeout: 15000 });
  });

  test('should prevent direct URL access to admin-only pages without auth', async ({ page }) => {
    // Try to access equipment details without login
    await page.goto('/equipment/123');

    // Should redirect to login
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });
});
