import { test, expect } from '@playwright/test';

test.describe('Edit Modal E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin (adjust URL as needed)
    await page.goto('/admin/login');
    await page.fill('[type="email"]', 'admin@example.com');
    await page.fill('[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('should open edit modal and allow course editing', async ({ page }) => {
    // Navigate to courses
    await page.goto('/admin/courses');
    await page.waitForLoadState('networkidle');

    // Find and click first edit button
    const editButton = page.locator('button').filter({ hasText: 'Edit' }).first();
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Wait for modal to open
    const modal = page.locator('[class*="fixed inset-0"]');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Check modal title
    const modalTitle = page.locator('h2');
    await expect(modalTitle).toContainText('Edit Course');

    // Test category dropdown
    const categorySelect = page.locator('#category');
    await expect(categorySelect).toBeVisible();
    
    // Click category dropdown to open it
    await categorySelect.click();
    
    // Check if options are visible
    const categoryOptions = page.locator('#category option');
    const optionCount = await categoryOptions.count();
    expect(optionCount).toBeGreaterThan(1);

    // Select a category
    await categorySelect.selectOption({ index: 1 });
    const selectedValue = await categorySelect.inputValue();
    expect(selectedValue).not.toBe('');

    // Test navigation to Resources step
    const nextButton = page.locator('button').filter({ hasText: 'Next' }).first();
    await nextButton.click();
    await page.waitForTimeout(500);

    // Click Next again to go to Resources
    const nextButton2 = page.locator('button').filter({ hasText: 'Next' }).first();
    await nextButton2.click();
    await page.waitForTimeout(1000);

    // Test resource upload
    const uploadButton = page.locator('button').filter({ hasText: 'Upload' }).first();
    await expect(uploadButton).toBeVisible();

    // Check for file input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveCount(1);

    // Navigate to Review step
    const nextButton3 = page.locator('button').filter({ hasText: 'Next' }).first();
    await nextButton3.click();
    await page.waitForTimeout(1000);

    // Test save button
    const saveButton = page.locator('button').filter({ hasText: 'Save Changes' });
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeEnabled();

    // Monitor console for errors
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    // Click save button
    await saveButton.click();
    await page.waitForTimeout(3000);

    // Check for 500 errors
    const has500Errors = consoleMessages.some(msg => 
      msg.includes('500') || msg.includes('Failed to load resource')
    );

    expect(has500Errors).toBe(false);

    // Check for success or error notifications
    const notifications = page.locator('[role="alert"], [class*="toast"]');
    const notificationCount = await notifications.count();
    
    if (notificationCount > 0) {
      const firstNotification = notifications.first();
      const notificationText = await firstNotification.textContent();
      
      // Should either show success or validation error, not 500 error
      expect(notificationText).not.toContain('Failed to update course');
    }
  });

  test('should handle form validation correctly', async ({ page }) => {
    await page.goto('/admin/courses');
    await page.waitForLoadState('networkidle');

    // Open edit modal
    const editButton = page.locator('button').filter({ hasText: 'Edit' }).first();
    await editButton.click();
    await page.locator('[class*="fixed inset-0"]').waitFor({ state: 'visible' });

    // Clear required fields
    await page.fill('#title', '');
    await page.selectOption('#category', '');

    // Navigate to review step
    for (let i = 0; i < 4; i++) {
      const nextButton = page.locator('button').filter({ hasText: 'Next' }).first();
      await nextButton.click();
      await page.waitForTimeout(500);
    }

    // Try to save
    const saveButton = page.locator('button').filter({ hasText: 'Save Changes' });
    await saveButton.click();
    await page.waitForTimeout(2000);

    // Should show validation error
    const notifications = page.locator('[role="alert"], [class*="toast"]');
    const hasValidationError = await notifications.filter({ hasText: 'required' }).count();
    
    expect(hasValidationError).toBeGreaterThan(0);
  });

  test('should handle file upload correctly', async ({ page }) => {
    await page.goto('/admin/courses');
    await page.waitForLoadState('networkidle');

    // Open edit modal
    const editButton = page.locator('button').filter({ hasText: 'Edit' }).first();
    await editButton.click();
    await page.locator('[class*="fixed inset-0"]').waitFor({ state: 'visible' });

    // Navigate to Resources step
    for (let i = 0; i < 3; i++) {
      const nextButton = page.locator('button').filter({ hasText: 'Next' }).first();
      await nextButton.click();
      await page.waitForTimeout(500);
    }

    // Test file upload
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();

    // Create a test file
    const testContent = 'Test document content';
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });

    // Upload file
    await fileInput.setInputFiles(testFile);
    await page.waitForTimeout(1000);

    // Check if file name appears
    const fileName = page.locator('text=📎 test.txt');
    await expect(fileName).toBeVisible();
  });

  test('should have proper styling and accessibility', async ({ page }) => {
    await page.goto('/admin/courses');
    await page.waitForLoadState('networkidle');

    // Open edit modal
    const editButton = page.locator('button').filter({ hasText: 'Edit' }).first();
    await editButton.click();
    await page.locator('[class*="fixed inset-0"]').waitFor({ state: 'visible' });

    // Check text visibility (black on white)
    const textInputs = page.locator('input[type="text"], textarea');
    const inputCount = await textInputs.count();
    
    for (let i = 0; i < Math.min(inputCount, 3); i++) {
      const input = textInputs.nth(i);
      const styles = await input.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      // Check if text is visible (not white on white)
      expect(styles.color).not.toBe('rgb(255, 255, 255)');
      expect(styles.backgroundColor).toBe('rgb(255, 255, 255)');
    }

    // Check dropdown styling
    const categorySelect = page.locator('#category');
    const selectStyles = await categorySelect.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor
      };
    });
    
    expect(selectStyles.color).not.toBe('rgb(255, 255, 255)');
    expect(selectStyles.backgroundColor).toBe('rgb(255, 255, 255)');
  });
});
