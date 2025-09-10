import { test, expect } from '@playwright/test';

test.describe('Campaign Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and assume user is already logged in
    await page.goto('/');
    
    // Mock authenticated state
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      }));
    });
  });

  test('should create a new campaign', async ({ page }) => {
    // Navigate to campaigns page
    await page.goto('/campaigns');
    
    // Click create campaign button
    await page.click('[data-testid="create-campaign-button"]');
    
    // Fill in campaign form
    await page.fill('[data-testid="campaign-name"]', 'Test E2E Campaign');
    await page.selectOption('[data-testid="campaign-type"]', 'google_ads');
    await page.fill('[data-testid="campaign-description"]', 'This is a test campaign for E2E testing');
    await page.fill('[data-testid="campaign-budget"]', '5000');
    
    // Set dates
    await page.fill('[data-testid="start-date"]', '2024-01-15');
    await page.fill('[data-testid="end-date"]', '2024-02-15');
    
    // Fill UTM parameters
    await page.click('[data-testid="auto-generate-utm"]');
    
    // Submit form
    await page.click('[data-testid="create-campaign-submit"]');
    
    // Verify campaign was created
    await expect(page.locator('text=Campaign Created')).toBeVisible();
    await expect(page.locator('text=Test E2E Campaign')).toBeVisible();
  });

  test('should display campaigns list', async ({ page }) => {
    await page.goto('/campaigns');
    
    // Should show campaigns table or empty state
    await expect(page.locator('[data-testid="campaigns-list"]')).toBeVisible();
  });

  test('should duplicate a campaign', async ({ page }) => {
    await page.goto('/campaigns');
    
    // Assume there's at least one campaign
    const campaignRow = page.locator('[data-testid="campaign-row"]').first();
    await campaignRow.locator('[data-testid="campaign-menu"]').click();
    await page.click('text=Duplicate');
    
    // Should open create dialog with pre-filled data
    await expect(page.locator('text=Duplicate Campaign')).toBeVisible();
    
    // Name should be suffixed with "(Copy)"
    const nameInput = page.locator('[data-testid="campaign-name"]');
    await expect(nameInput).toHaveValue(/.*\(Copy\)$/);
  });
});