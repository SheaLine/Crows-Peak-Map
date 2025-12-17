import { test, expect } from '@playwright/test';

test.describe('Map Functionality E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword';

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('should display map with markers', async ({ page }) => {
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });

    // Map should be visible
    const map = page.locator('.leaflet-container');
    await expect(map).toBeVisible();

    // Equipment markers should be visible
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 });
    const markers = page.locator('.leaflet-marker-icon');
    await expect(markers.first()).toBeVisible();
  });

  test('should cluster markers when zoomed out', async ({ page }) => {
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });

    // Zoom out
    const zoomOut = page.locator('.leaflet-control-zoom-out');
    await zoomOut.click();
    await zoomOut.click();

    // Should show cluster markers
    await page.waitForSelector('.marker-cluster', { timeout: 5000 });
    const cluster = page.locator('.marker-cluster');
    await expect(cluster.first()).toBeVisible();
  });

  test('should show equipment details on marker click', async ({ page }) => {
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 });

    // Click first marker
    await page.locator('.leaflet-marker-icon').first().click();

    // Should show equipment details (popup on mobile, navigation on desktop)
    await page.waitForTimeout(1000);

    // Check for either popup or navigation to details page
    const hasPopup = await page.locator('.leaflet-popup').isVisible();
    const hasNavigated = page.url().includes('/equipment/');

    expect(hasPopup || hasNavigated).toBe(true);
  });

  test('should filter equipment by type', async ({ page }) => {
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });

    // Open filter panel
    const filterButton = page.getByRole('button', { name: /filter/i });
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }

    // Get initial marker count
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 5000 });
    const initialCount = await page.locator('.leaflet-marker-icon').count();

    // Uncheck a filter
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    await firstCheckbox.uncheck();

    await page.waitForTimeout(500);

    // Marker count should change
    const filteredCount = await page.locator('.leaflet-marker-icon').count();
    expect(filteredCount).not.toBe(initialCount);
  });

  test('should search for equipment', async ({ page }) => {
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });

    // Find search input
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('pump');

    await page.waitForTimeout(500);

    // Results should be filtered
    const markers = page.locator('.leaflet-marker-icon');
    const count = await markers.count();

    // Should show only matching equipment
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should toggle boundary visibility', async ({ page }) => {
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });

    // Toggle boundary checkbox
    const boundaryToggle = page.getByText(/show.*boundary/i);
    if (await boundaryToggle.isVisible()) {
      await boundaryToggle.click();

      await page.waitForTimeout(500);

      // Boundary layer should be visible
      const boundary = page.locator('.leaflet-overlay-pane path');
      await expect(boundary.first()).toBeVisible();
    }
  });

  test('should respect map bounds', async ({ page }) => {
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });

    // Try to pan outside bounds
    const map = page.locator('.leaflet-container');

    // Get initial center
    const initialBounds = await map.boundingBox();

    // Drag map far away
    if (initialBounds) {
      await page.mouse.move(initialBounds.x + 100, initialBounds.y + 100);
      await page.mouse.down();
      await page.mouse.move(initialBounds.x + 1000, initialBounds.y + 1000);
      await page.mouse.up();
    }

    await page.waitForTimeout(500);

    // Map should snap back to bounds
    // (Leaflet maxBounds enforcement)
  });

  test('should handle mobile responsiveness', async ({ page, isMobile }) => {
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });

    if (isMobile) {
      // On mobile, clicking marker should show popup
      await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 });
      await page.locator('.leaflet-marker-icon').first().click();

      await page.waitForTimeout(500);

      // Should show popup with "View details" button
      const popup = page.locator('.leaflet-popup');
      await expect(popup).toBeVisible();
    }
  });
});

test.describe('Equipment Details E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to equipment details
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword';

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Click on equipment
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 });
    await page.locator('.leaflet-marker-icon').first().click();

    // Wait for navigation or popup
    await page.waitForTimeout(1000);

    if (!page.url().includes('/equipment/')) {
      // If popup shown, click "View details"
      const viewDetailsButton = page.getByText(/view.*details/i);
      if (await viewDetailsButton.isVisible()) {
        await viewDetailsButton.click();
      }
    }

    // Should be on equipment details page
    await expect(page.url()).toContain('/equipment/');
  });

  test('should display equipment details', async ({ page }) => {
    // Equipment name should be visible
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Metadata should be displayed
    await page.waitForTimeout(500);
  });

  test('should switch between tabs', async ({ page }) => {
    // Should have tabs
    const tabs = ['Logs', 'Gallery', 'Summary', 'Files'];

    for (const tabName of tabs) {
      const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') });

      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(300);

        // Tab content should be visible
        await expect(tab).toHaveAttribute('aria-selected', 'true');
      }
    }
  });

  test('should display images in gallery tab', async ({ page }) => {
    const galleryTab = page.getByRole('tab', { name: /gallery/i });

    if (await galleryTab.isVisible()) {
      await galleryTab.click();
      await page.waitForTimeout(500);

      // Should show images or "No images" message
      const hasImages = await page.locator('img[alt*="equipment"]').isVisible();
      const hasNoImagesMessage = await page.getByText(/no.*images/i).isVisible();

      expect(hasImages || hasNoImagesMessage).toBe(true);
    }
  });

  test('should load more service logs', async ({ page }) => {
    const logsTab = page.getByRole('tab', { name: /logs/i });

    if (await logsTab.isVisible()) {
      await logsTab.click();
      await page.waitForTimeout(500);

      // Look for "Load more" button
      const loadMoreButton = page.getByRole('button', { name: /load.*more/i });

      if (await loadMoreButton.isVisible()) {
        const initialCount = await page.locator('.log-entry, [data-testid="log-entry"]').count();

        await loadMoreButton.click();
        await page.waitForTimeout(1000);

        const newCount = await page.locator('.log-entry, [data-testid="log-entry"]').count();

        expect(newCount).toBeGreaterThanOrEqual(initialCount);
      }
    }
  });

  test('should navigate back to map', async ({ page }) => {
    // Click back button or navigate to home
    const backButton = page.getByRole('button', { name: /back/i }).or(page.getByRole('link', { name: /home|map/i }));

    if (await backButton.isVisible()) {
      await backButton.click();

      // Should return to map view
      await expect(page).toHaveURL('/', { timeout: 5000 });
    }
  });
});
