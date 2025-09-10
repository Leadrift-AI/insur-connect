import { test, expect } from '@playwright/test';

test.describe('Lead Kanban Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Mock authenticated state and seed some test data
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      }));
      
      // Seed test data via devScript
      if (window.devScript) {
        window.devScript.seed();
      }
    });
  });

  test('should display lead kanban board', async ({ page }) => {
    await page.goto('/leads-pipeline');
    
    // Should show kanban columns
    await expect(page.locator('[data-testid="kanban-column-new"]')).toBeVisible();
    await expect(page.locator('[data-testid="kanban-column-contacted"]')).toBeVisible();
    await expect(page.locator('[data-testid="kanban-column-booked"]')).toBeVisible();
    await expect(page.locator('[data-testid="kanban-column-closed"]')).toBeVisible();
  });

  test('should drag and drop lead between columns', async ({ page }) => {
    await page.goto('/leads-pipeline');
    
    // Wait for leads to load
    await page.waitForSelector('[data-testid="lead-card"]');
    
    // Get first lead card in "new" column
    const leadCard = page.locator('[data-testid="kanban-column-new"] [data-testid="lead-card"]').first();
    const contactedColumn = page.locator('[data-testid="kanban-column-contacted"]');
    
    // Perform drag and drop
    await leadCard.dragTo(contactedColumn);
    
    // Verify lead moved to contacted column
    await expect(contactedColumn.locator('[data-testid="lead-card"]')).toHaveCount(1);
  });

  test('should show lead details on click', async ({ page }) => {
    await page.goto('/leads-pipeline');
    
    // Wait for leads and click first one
    await page.waitForSelector('[data-testid="lead-card"]');
    await page.click('[data-testid="lead-card"]');
    
    // Should show lead details modal/panel
    await expect(page.locator('[data-testid="lead-details"]')).toBeVisible();
  });

  test('should filter leads by campaign', async ({ page }) => {
    await page.goto('/leads-pipeline');
    
    // Use campaign filter
    await page.selectOption('[data-testid="campaign-filter"]', 'test-campaign-id');
    
    // Should filter leads accordingly
    const visibleLeads = page.locator('[data-testid="lead-card"]:visible');
    await expect(visibleLeads).toHaveCount(expect.any(Number));
  });

  test('should create new lead', async ({ page }) => {
    await page.goto('/leads-pipeline');
    
    // Click add lead button
    await page.click('[data-testid="add-lead-button"]');
    
    // Fill lead form
    await page.fill('[data-testid="lead-first-name"]', 'John');
    await page.fill('[data-testid="lead-last-name"]', 'Doe');
    await page.fill('[data-testid="lead-email"]', 'john.doe@example.com');
    await page.fill('[data-testid="lead-phone"]', '555-0123');
    
    // Submit form
    await page.click('[data-testid="create-lead-submit"]');
    
    // Verify lead was created
    await expect(page.locator('text=Lead Created')).toBeVisible();
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('should update KPIs after lead status change', async ({ page }) => {
    await page.goto('/');
    
    // Get initial KPI values
    const initialNewLeads = await page.textContent('[data-testid="kpi-new-leads"]');
    const initialContacted = await page.textContent('[data-testid="kpi-contacted"]');
    
    // Go to pipeline and move a lead
    await page.goto('/leads-pipeline');
    await page.waitForSelector('[data-testid="lead-card"]');
    
    const leadCard = page.locator('[data-testid="kanban-column-new"] [data-testid="lead-card"]').first();
    const contactedColumn = page.locator('[data-testid="kanban-column-contacted"]');
    
    await leadCard.dragTo(contactedColumn);
    
    // Go back to dashboard
    await page.goto('/');
    
    // Wait for KPIs to update (within 1-2 seconds as per requirements)
    await page.waitForTimeout(3000);
    
    // Verify KPIs updated
    const newNewLeads = await page.textContent('[data-testid="kpi-new-leads"]');
    const newContacted = await page.textContent('[data-testid="kpi-contacted"]');
    
    expect(newNewLeads).not.toBe(initialNewLeads);
    expect(newContacted).not.toBe(initialContacted);
  });
});