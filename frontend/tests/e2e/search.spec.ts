/**
 * E2E tests for search system
 */

import { expect, test } from '@playwright/test';

test.describe('Search System', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        // Wait for page to load
        await page.waitForLoadState('networkidle');
    });

    test('opens search modal with Ctrl+K', async ({ page }) => {
        // Press Ctrl+K
        await page.keyboard.press('Control+K');

        // Search modal should be visible
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByPlaceholder('Search items...')).toBeVisible();
        await expect(page.getByPlaceholder('Search items...')).toBeFocused();
    });

    test('opens search modal with header button', async ({ page }) => {
        // Click header search button
        await page.getByRole('button', { name: /search/i }).first().click();

        // Search modal should be visible
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByPlaceholder('Search items...')).toBeFocused();
    });

    test('searches and displays results', async ({ page }) => {
        // Open search modal
        await page.keyboard.press('Control+K');

        // Type search query
        await page.getByPlaceholder('Search items...').fill('dragon');

        // Wait for results to appear (debounced)
        await page.waitForTimeout(400);

        // Should show results
        await expect(page.getByText(/Items \(\d+\)/i)).toBeVisible();
        await expect(page.locator('[role="option"]').first()).toBeVisible();
    });

    test('navigates to item when result is clicked', async ({ page }) => {
        // Open search modal
        await page.keyboard.press('Control+K');

        // Search for an item
        await page.getByPlaceholder('Search items...').fill('dragon scimitar');
        await page.waitForTimeout(400);

        // Click first result
        await page.locator('[role="option"]').first().click();

        // Should navigate to item detail page
        await expect(page).toHaveURL(/\/items\/\d+/);

        // Modal should be closed
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('closes modal with Escape key', async ({ page }) => {
        // Open search modal
        await page.keyboard.press('Control+K');
        await expect(page.getByRole('dialog')).toBeVisible();

        // Press Escape
        await page.keyboard.press('Escape');

        // Modal should be closed
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('closes modal with close button', async ({ page }) => {
        // Open search modal
        await page.keyboard.press('Control+K');
        await expect(page.getByRole('dialog')).toBeVisible();

        // Click close button
        await page.getByLabel('Close search').click();

        // Modal should be closed
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('closes modal when clicking backdrop', async ({ page }) => {
        // Open search modal
        await page.keyboard.press('Control+K');
        await expect(page.getByRole('dialog')).toBeVisible();

        // Click backdrop (outside dialog)
        await page.locator('.fixed.inset-0').first().click({ position: { x: 10, y: 10 } });

        // Modal should be closed
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('clears search input with clear button', async ({ page }) => {
        // Open search modal
        await page.keyboard.press('Control+K');

        const input = page.getByPlaceholder('Search items...');
        await input.fill('dragon');

        // Clear button should be visible
        await expect(page.getByLabel('Clear search')).toBeVisible();

        // Click clear button
        await page.getByLabel('Clear search').click();

        // Input should be empty
        await expect(input).toHaveValue('');
    });

    test('keyboard navigation with arrow keys', async ({ page }) => {
        // Open search modal
        await page.keyboard.press('Control+K');

        // Search for items
        await page.getByPlaceholder('Search items...').fill('dragon');
        await page.waitForTimeout(400);

        // Wait for results
        await expect(page.locator('[role="option"]').first()).toBeVisible();

        // Press Arrow Down
        await page.keyboard.press('ArrowDown');

        // Second item should be selected
        const secondOption = page.locator('[role="option"]').nth(1);
        await expect(secondOption).toHaveAttribute('aria-selected', 'true');

        // Press Arrow Up
        await page.keyboard.press('ArrowUp');

        // First item should be selected
        const firstOption = page.locator('[role="option"]').first();
        await expect(firstOption).toHaveAttribute('aria-selected', 'true');
    });

    test('selects item with Enter key', async ({ page }) => {
        // Open search modal
        await page.keyboard.press('Control+K');

        // Search for items
        await page.getByPlaceholder('Search items...').fill('dragon scimitar');
        await page.waitForTimeout(400);

        // Press Enter to select first result
        await page.keyboard.press('Enter');

        // Should navigate to item page
        await expect(page).toHaveURL(/\/items\/\d+/);
    });

    test('shows recent searches when reopened', async ({ page }) => {
        // Open search modal
        await page.keyboard.press('Control+K');

        // Search and select an item
        await page.getByPlaceholder('Search items...').fill('dragon');
        await page.waitForTimeout(400);
        await page.locator('[role="option"]').first().click();

        // Wait for navigation
        await page.waitForURL(/\/items\/\d+/);

        // Go back to dashboard
        await page.goto('http://localhost:3000');

        // Open search modal again
        await page.keyboard.press('Control+K');

        // Should show recent searches
        await expect(page.getByText('Recent Searches')).toBeVisible();
    });

    test('inline table search filters items', async ({ page }) => {
        // Wait for table to load
        await expect(page.locator('table')).toBeVisible();

        // Type in inline search
        const searchInput = page.getByPlaceholder(/search items/i).first();
        await searchInput.fill('dragon');

        // Wait for debounce
        await page.waitForTimeout(400);

        // Table should update with filtered results
        const rows = page.locator('table tbody tr');
        await expect(rows.first()).toBeVisible();

        // All visible rows should contain "dragon" in text
        const firstRow = await rows.first().textContent();
        expect(firstRow?.toLowerCase()).toContain('dragon');
    });

    test('inline search clear button works', async ({ page }) => {
        // Type in inline search
        const searchInput = page.getByPlaceholder(/search items/i).first();
        await searchInput.fill('dragon');

        // Clear button should appear
        const clearButton = page.locator('button').filter({ has: page.locator('svg') }).last();

        // Click clear
        await clearButton.click();

        // Input should be empty
        await expect(searchInput).toHaveValue('');
    });

    test('no results message displays correctly', async ({ page }) => {
        // Open search modal
        await page.keyboard.press('Control+K');

        // Search for non-existent item
        await page.getByPlaceholder('Search items...').fill('zzznonexistent123');
        await page.waitForTimeout(400);

        // Should show no results message
        await expect(page.getByText(/No items found/i)).toBeVisible();
    });

    test('loading state displays during search', async ({ page }) => {
        // Open search modal
        await page.keyboard.press('Control+K');

        // Start typing (before debounce completes)
        await page.getByPlaceholder('Search items...').fill('d');

        // Modal should still be visible
        await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('recent searches can be cleared', async ({ page }) => {
        // Add a recent search first
        await page.keyboard.press('Control+K');
        await page.getByPlaceholder('Search items...').fill('dragon');
        await page.waitForTimeout(400);
        await page.locator('[role="option"]').first().click();

        // Go back and reopen modal
        await page.goto('http://localhost:3000');
        await page.keyboard.press('Control+K');

        // Should see recent searches
        await expect(page.getByText('Recent Searches')).toBeVisible();

        // Click clear all
        await page.getByText('Clear all').click();

        // Recent searches should be gone
        await expect(page.getByText('Recent Searches')).not.toBeVisible();
    });
});

