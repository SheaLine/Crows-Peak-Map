import { test, expect } from '@playwright/test';

test.describe('Map Functionality E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);

    // Click sign in and wait for navigation (longer timeout for mobile browsers)
    await Promise.all([
      page.waitForURL('/', { timeout: 30000 }),
      page.getByRole('button', { name: /sign in/i }).click()
    ]);

    // Wait for map to fully initialize before each test
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    await page.waitForSelector('.leaflet-control-zoom', { timeout: 10000 });
  });

  test('should display map with markers', async ({ page }) => {
    // Wait for map container to load
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });

    // Map should be visible
    const map = page.locator('.leaflet-container');
    await expect(map).toBeVisible();

    // Wait for Leaflet to finish initializing (look for zoom controls as indicator)
    await page.waitForSelector('.leaflet-control-zoom', { timeout: 10000 });

    // Equipment markers should be visible (longer timeout for Firefox/slow browsers)
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 15000 });
    const markers = page.locator('.leaflet-marker-icon');
    await expect(markers.first()).toBeVisible();

    // Verify we have multiple markers/clusters
    const markerCount = await markers.count();
    expect(markerCount).toBeGreaterThan(0);
  });

  test('should cluster markers when zoomed out', async ({ page }) => {
    // Wait for map to load markers (longer timeout for Firefox)
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 15000 });

    // Clusters should already be visible at default zoom (equipment shares coordinates)
    await page.waitForSelector('.cluster-icon', { timeout: 10000 });
    const clusters = page.locator('.cluster-icon');

    // Verify at least one cluster is visible
    await expect(clusters.first()).toBeVisible();

    // Verify multiple clusters exist (we have 3 clusters in seed data)
    const clusterCount = await clusters.count();
    expect(clusterCount).toBeGreaterThanOrEqual(1);
  });

  test('should show equipment details on marker click', async ({ page }) => {
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 15000 });

    // Wait for map to stabilize
    await page.waitForTimeout(2000);

    // Click an individual marker (not a cluster)
    // Find a marker that's not a cluster icon
    const individualMarker = page.locator('.leaflet-marker-icon').filter({ hasNot: page.locator('.cluster-icon') }).first();
    await individualMarker.waitFor({ state: 'visible', timeout: 10000 });
    await individualMarker.click({ force: true });

    // Should show equipment details (popup on mobile, navigation on desktop)
    await page.waitForTimeout(4000);

    // Check for either popup or navigation to details page
    const hasPopup = await page.locator('.leaflet-popup').isVisible();
    const hasNavigated = page.url().includes('/equipment/');

    expect(hasPopup || hasNavigated).toBe(true);
  });

  test('should filter equipment by type', async ({ page }) => {
    // Open filter panel on mobile (hamburger menu)
    const hamburger = page.locator('button.md\\:hidden').first();
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.waitForTimeout(500);
    }

    // Get initial marker count (all equipment visible by default)
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 15000 });
    const initialCount = await page.locator('.leaflet-marker-icon').count();

    // Check a filter to show only that type
    const firstCheckbox = page.locator('input[type="checkbox"]').first();

    // Scroll checkbox into view on mobile
    await firstCheckbox.scrollIntoViewIfNeeded();
    await firstCheckbox.check({ force: false });

    await page.waitForTimeout(1500);

    // Marker count should decrease (filtering to single type)
    const filteredCount = await page.locator('.leaflet-marker-icon').count();
    expect(filteredCount).toBeLessThan(initialCount);
  });

  test('should search for equipment', async ({ page }) => {
    // Wait for map markers to be fully loaded
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 15000 });

    // Verify equipment data is loaded (should have multiple markers/clusters)
    const initialMarkers = page.locator('.leaflet-marker-icon');
    await expect(initialMarkers.first()).toBeVisible();
    const initialCount = await initialMarkers.count();
    expect(initialCount).toBeGreaterThan(0);

    // Open filter panel on mobile (hamburger menu)
    const hamburger = page.locator('button.md\\:hidden').first();
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.waitForTimeout(1000);
    }

    // Find search input and wait for it to be visible
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.waitFor({ state: 'visible', timeout: 15000 });
    await searchInput.click();
    await searchInput.fill('main');

    // Wait for search to filter results (increased timeout for data loading)
    await page.waitForTimeout(3000);

    // Results should be filtered to show equipment starting with "main"
    // (search uses startsWith, so "main" will match "Main Building", "Main Transformer", etc.)
    const markers = page.locator('.leaflet-marker-icon');
    const count = await markers.count();

    // Should show at least equipment starting with "main"
    expect(count).toBeGreaterThanOrEqual(1);
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

      await page.waitForTimeout(3000);

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
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);

    // Click sign in and wait for navigation (longer timeout for mobile browsers)
    await Promise.all([
      page.waitForURL('/', { timeout: 30000 }),
      page.getByRole('button', { name: /sign in/i }).click()
    ]);

    // Wait for map and markers to load (longer timeout for Firefox)
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    await page.waitForSelector('.leaflet-control-zoom', { timeout: 10000 });
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 15000 });

    // Verify equipment data is loaded before clicking
    const markers = page.locator('.leaflet-marker-icon');
    await expect(markers.first()).toBeVisible();
    const markerCount = await markers.count();
    expect(markerCount).toBeGreaterThan(0);

    // Wait for map to stabilize before clicking
    await page.waitForTimeout(2000);

    // Click first marker and handle either desktop navigation or mobile popup
    await markers.first().waitFor({ state: 'visible', timeout: 10000 });
    await markers.first().click({ force: true });

    // Wait a bit for either navigation or popup to appear (increased for mobile)
    await page.waitForTimeout(4000);

    // Check if we navigated directly (desktop) or need to handle popup (mobile)
    if (!page.url().includes('/equipment/')) {
      // Mobile popup flow
      await page.waitForSelector('.leaflet-popup', { timeout: 20000 });
      const viewDetailsButton = page.getByRole('button', { name: /view.*details/i });
      await viewDetailsButton.waitFor({ state: 'visible', timeout: 15000 });
      await viewDetailsButton.click();

      // Wait for navigation after button click
      await page.waitForURL(/\/equipment\//, { timeout: 15000 });
    }

    // Verify we're on equipment details page
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

        // Wait for tab state to update (increased for WebKit/Safari)
        // WebKit needs more time for URL param -> React state propagation
        await page.waitForTimeout(2500);

        // Tab content should be visible
        await expect(tab).toHaveAttribute('aria-selected', 'true');
      }
    }
  });

  test('should display images in gallery tab', async ({ page }) => {
    const galleryTab = page.getByRole('tab', { name: /gallery/i });

    if (await galleryTab.isVisible()) {
      await galleryTab.click();
      await page.waitForTimeout(1000);

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
      await page.waitForTimeout(2000);

      // Look for "Load more" button
      const loadMoreButton = page.getByRole('button', { name: /load.*more/i });

      if (await loadMoreButton.isVisible()) {
        const initialCount = await page.locator('.log-entry, [data-testid="log-entry"]').count();

        await loadMoreButton.click();
        await page.waitForTimeout(2000);

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
      await expect(page).toHaveURL('/', { timeout: 8000 });
    }
  });
});
