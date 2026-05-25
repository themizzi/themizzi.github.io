import { expect } from '@playwright/test';
import { test } from './fixtures.js';

test.describe('Pagination Component', () => {
  test('should not show pagination when items fit on one page', async ({ paginatedPage }) => {
    // Create 8 items with default pagerSize (10 per page)
    await paginatedPage.createWithItems(8);

    // Navigate to test section page
    await paginatedPage.goToPage(1);

    // Pagination should not be visible since 8 items fit on one page (default 10 per page)
    const pagination = paginatedPage.getPaginationContainer();
    await expect(pagination).not.toBeVisible();
  });

  test('should not show pagination when items equal page size', async ({ paginatedPage }) => {
    // Create exactly 5 items with 5 items per page
    await paginatedPage.createWithItems(5, { pagerSize: 5 });

    await paginatedPage.goToPage(1);

    // Pagination should not be visible since exactly 5 items fit on one page
    const pagination = paginatedPage.getPaginationContainer();
    await expect(pagination).not.toBeVisible();
  });

  test('should show pagination when items exceed page size', async ({ paginatedPage }) => {
    // Create 12 items with default pagerSize (10 per page) = 2 pages
    await paginatedPage.createWithItems(12);

    await paginatedPage.goToPage(1);

    // Pagination should be visible since 12 items require 2 pages
    const pagination = paginatedPage.getPaginationContainer();
    await expect(pagination).toBeVisible();
  });

  test('should disable first page link when on first page', async ({ paginatedPage }) => {
    // Create 15 items with default pagerSize (10 per page) = 2 pages
    await paginatedPage.createWithItems(15);

    // Navigate to first page (default)
    await paginatedPage.goToPage(1);

    // First page link should be disabled when on first page
    const firstPageDisabled = paginatedPage.getFirstPageDisabled();
    await expect(firstPageDisabled).toBeVisible();

    // First page link (as clickable element) should not exist
    const firstPageLink = paginatedPage.getFirstPageLink();
    await expect(firstPageLink).not.toBeVisible();
  });

  test('should enable first page link when on second page', async ({ paginatedPage }) => {
    // Create 15 items with default pagerSize (10 per page) = 2 pages
    await paginatedPage.createWithItems(15);

    // Navigate to second page
    await paginatedPage.goToPage(2);

    // First page link should be enabled when on second page
    const firstPageLink = paginatedPage.getFirstPageLink();
    await expect(firstPageLink).toBeVisible();

    // First page disabled span should not exist
    const firstPageDisabled = paginatedPage.getFirstPageDisabled();
    await expect(firstPageDisabled).not.toBeVisible();

    // Verify the link goes to the first page
    await expect(firstPageLink).toHaveAttribute('href', '/test-section/');
  });

  test('should disable previous page link when on first page', async ({ paginatedPage }) => {
    // Create 15 items with default pagerSize (10 per page) = 2 pages
    await paginatedPage.createWithItems(15);

    // Navigate to first page (default)
    await paginatedPage.goToPage(1);

    // Previous page link should be disabled when on first page
    const previousPageDisabled = paginatedPage.getPreviousPageDisabled();
    await expect(previousPageDisabled).toBeVisible();
  });

  test('should enable previous page link when on second page', async ({ paginatedPage }) => {
    // Create 15 items with default pagerSize (10 per page) = 2 pages
    await paginatedPage.createWithItems(15);

    // Navigate to second page
    await paginatedPage.goToPage(2);

    // Click the previous page link and verify it navigates to the first page
    await paginatedPage.clickPreviousPageLink();
    expect(paginatedPage.getCurrentPage()).toBe(1);
  });

  test('should disable next page link when on last page', async ({ paginatedPage }) => {
    // Create 15 items with default pagerSize (10 per page) = 2 pages
    await paginatedPage.createWithItems(15);

    // Navigate to last page (page 2)
    await paginatedPage.goToPage(2);

    // Next page link should be disabled when on last page
    const nextPageDisabled = paginatedPage.getNextPageDisabled();
    await expect(nextPageDisabled).toBeVisible();
  });

  test('should enable next page link when on first page', async ({ paginatedPage }) => {
    // Create 15 items with default pagerSize (10 per page) = 2 pages
    await paginatedPage.createWithItems(15);

    // Navigate to first page (default)
    await paginatedPage.goToPage(1);

    // Click the next page link and verify it navigates to the second page
    await paginatedPage.clickNextPageLink();
    expect(paginatedPage.getCurrentPage()).toBe(2);
  });

  test('should disable last page link when on last page', async ({ paginatedPage }) => {
    // Create 15 items with default pagerSize (10 per page) = 2 pages
    await paginatedPage.createWithItems(15);

    // Navigate to last page (page 2)
    await paginatedPage.goToPage(2);

    // Last page link should be disabled when on last page
    const lastPageDisabled = paginatedPage.getLastPageDisabled();
    await expect(lastPageDisabled).toBeVisible();
  });

  test('should enable last page link when on first page', async ({ paginatedPage }) => {
    // Create 15 items with default pagerSize (10 per page) = 2 pages
    await paginatedPage.createWithItems(15);

    // Navigate to first page (default)
    await paginatedPage.goToPage(1);

    // Click the last page link and verify it navigates to the last page
    const lastPageLink = paginatedPage.getLastPageLink();
    await lastPageLink.click();

    // Verify the URL is for page 2
    expect(paginatedPage.getCurrentPage()).toBe(2);
  });

  test('should show current page indicator with correct page number', async ({ paginatedPage }) => {
    // Create 25 items with default pagerSize (10 per page) = 3 pages
    await paginatedPage.createWithItems(25);

    // Navigate to second page and verify current page indicator shows "2"
    await paginatedPage.goToPage(2);

    // Verify the current page indicator text is "2"
    const currentPageIndicator = paginatedPage.getCurrentPageIndicator();
    await expect(currentPageIndicator).toHaveText('2');
  });

  test('should navigate to correct page when clicking numbered page link', async ({ paginatedPage }) => {
    // Create 25 items with default pagerSize (10 per page) = 3 pages
    await paginatedPage.createWithItems(25);

    // Start on first page
    await paginatedPage.goToPage(1);

    // Click on page 3 link and verify navigation
    await paginatedPage.clickPageNumberLink(3);
    expect(paginatedPage.getCurrentPage()).toBe(3);
  });

  test('should navigate to first page when clicking numbered "1" page link', async ({ paginatedPage }) => {
    // Create 25 items with default pagerSize (10 per page) = 3 pages
    await paginatedPage.createWithItems(25);

    // Start on second page
    await paginatedPage.goToPage(2);

    // Click on page 1 link and verify navigation to first page (no /page/1/ in URL)
    await paginatedPage.clickPageNumberLink(1);
    expect(paginatedPage.getCurrentPage()).toBe(1);
  });

  test('should show invisible spans for out-of-range page numbers', async ({ paginatedPage }) => {
    // Create 15 items with default pagerSize (10 per page) = 2 pages
    // With maxPagesToShow=5, on page 1: startPage=-1, endPage=3
    // Range seq(-1,3) = [-1, 0, 1, 2, 3], where -1 and 0 are < 1 (appear before current page)
    await paginatedPage.createWithItems(15);

    // Navigate to page 1
    await paginatedPage.goToPage(1);

    // Verify exactly 2 invisible spans appear before the current page indicator
    const invisibleSpansBeforeCurrent = paginatedPage.getInvisibleSpansBeforeCurrentPage();
    await expect(invisibleSpansBeforeCurrent).toHaveCount(2);
  });

  test('should show invisible spans after current page when on early pages', async ({ paginatedPage }) => {
    // Create 15 items with default pagerSize (10 per page) = 2 pages
    // With maxPagesToShow=5, on page 2: startPage=0, endPage=4
    // Range seq(0,4) = [0, 1, 2, 3, 4]
    // Here, 3 and 4 are > 2 (total pages), so they appear as invisible spans after current page
    await paginatedPage.createWithItems(15);

    // Navigate to last page (page 2)
    await paginatedPage.goToPage(2);

    // Verify that there are exactly 2 invisible spans after the current page
    const invisibleSpansAfterCurrent = paginatedPage.getInvisibleSpansAfterCurrentPage();
    await expect(invisibleSpansAfterCurrent).toHaveCount(2);
  });

  test('should constrain pages when there are more pages than maxPaginationPages', async ({ paginatedPage }) => {
    // Create 25 items with 5 per page = 5 pages total
    // Set maxPaginationPages to 3, so only 3 page indicators should be visible
    await paginatedPage.createWithItems(25, { pagerSize: 5, maxPaginationPages: 3 });

    // Navigate to middle page (page 3)
    await paginatedPage.goToPage(3);

    // Count all page number links and current page indicators (excluding nav arrows)
    const pageLinks = paginatedPage.getAllPageIndicators();
    await expect(pageLinks).toHaveCount(3); // Should show exactly 3 page indicators (pages 2, 3, 4)
  });

  test('should show one extra page when maxPaginationPages is even to keep current page centered', async ({ paginatedPage }) => {
    // Create 30 items with 5 per page = 6 pages total
    // Set maxPaginationPages to 4 (even number)
    await paginatedPage.createWithItems(30, { pagerSize: 5, maxPaginationPages: 4 });

    // Navigate to page 4
    await paginatedPage.goToPage(4);

    // With maxPaginationPages=4 (even), the logic will show 5 pages to keep current page centered
    // This shows maxPaginationPages + 1 = 5 pages, with current page in the center
    const allPageElements = paginatedPage.getAllPageElements();
    await expect(allPageElements).toHaveCount(5); // Shows 5 pages (4 + 1) to keep current centered
  });
});
