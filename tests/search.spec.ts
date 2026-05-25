import { expect } from '@playwright/test';
import { test } from './fixtures.js';

test.describe('Search Functionality', () => {
  test('should load search page with form elements', async ({ page, server }) => {
    // GIVEN a Hugo site with search functionality
    const { baseURL } = await server.start();

    // WHEN visiting the search page
    await page.goto(`${baseURL}/search/`);

    // THEN the search input should be present
    await expect(page.locator('#search-input')).toBeVisible();
  });

  test('should display search form with correct attributes', async ({ page, server }) => {
    // GIVEN a Hugo site with search functionality
    const { baseURL } = await server.start();

    // WHEN visiting the search page
    await page.goto(`${baseURL}/search/`);

    // THEN the search input should have the correct placeholder
    await expect(page.locator('#search-input')).toHaveAttribute('placeholder', 'Search artists, albums, songs, and more...');
  });

  test('should have search results container', async ({ page, server }) => {
    // GIVEN a Hugo site with search functionality
    const { baseURL } = await server.start();

    // WHEN visiting the search page
    await page.goto(`${baseURL}/search/`);

    // THEN the search results container should be present
    await expect(page.locator('#search-results')).toBeAttached();
  });

  test('should have search result template', async ({ page, server }) => {
    // GIVEN a Hugo site with search functionality
    const { baseURL } = await server.start();

    // WHEN visiting the search page
    await page.goto(`${baseURL}/search/`);

    // THEN the search result template should be present in DOM
    await expect(page.locator('#search-result-template')).toBeAttached();
  });

  test('should load search index successfully', async ({ page, server }) => {
    // GIVEN a Hugo site with search functionality
    const { baseURL } = await server.start();
    await page.goto(`${baseURL}/search/`);

    // WHEN waiting for search index to load
    await page.waitForLoadState('networkidle');

    // THEN the search index should be accessible
    const response = await page.request.get(`${baseURL}/search-index.json`);
    await expect(response).toBeOK();
  });

  test('should prevent form submission with default behavior', async ({ page, server }) => {
    // GIVEN a Hugo site with search functionality
    const { baseURL } = await server.start();
    await page.goto(`${baseURL}/search/`);

    // WHEN submitting the search form
    await page.locator('#search-input').fill('test query');
    await page.locator('.search-form').dispatchEvent('submit');

    // THEN the page should not navigate away (URL should remain the same)
    await expect(page).toHaveURL(`${baseURL}/search/`);
  });

  test('should display search results when typing query', async ({ page, server }) => {
    // GIVEN a Hugo site with search functionality and content
    const indexContent = `
---
title: "Home"
---
Welcome to our music site featuring Joe Mizzi and The Bollweevils.
`;
    const aboutContent = `
---
title: "About Joe Mizzi"
---
Joe Mizzi is a Chicago-based musician and tech leader.
`;
    const { baseURL } = await server.start({
      indexContent,
      aboutContent,
    });
    await page.goto(`${baseURL}/search/`);
    await page.waitForLoadState('networkidle');

    // WHEN typing a search query
    await page.locator('#search-input').fill('Mizzi');
    await page.waitForTimeout(500); // Wait for debounce

    // THEN search results should be displayed
    await expect(page.locator('.search-result').first()).toBeVisible();
  });

  test('should highlight search terms in result titles', async ({ page, server }) => {
    // GIVEN a Hugo site with search functionality and content
    const aboutContent = `
---
title: "About Joe Mizzi"
---
Joe Mizzi is a Chicago-based musician.
`;
    const { baseURL } = await server.start({ aboutContent });
    await page.goto(`${baseURL}/search/`);
    await page.waitForLoadState('networkidle');

    // WHEN searching for a term that appears in titles
    await page.locator('#search-input').fill('Mizzi');
    await page.waitForTimeout(500);

    // THEN the search term should be highlighted in the title
    await expect(page.locator('.search-result-link mark')).toBeVisible();
  });

  test('should highlight search terms in result excerpts', async ({ page, server }) => {
    // GIVEN a Hugo site with search functionality and content
    const aboutContent = `
---
title: "About"
---
Joe Mizzi is a Chicago-based musician and tech leader.
`;
    const { baseURL } = await server.start({ aboutContent });
    await page.goto(`${baseURL}/search/`);
    await page.waitForLoadState('networkidle');

    // WHEN searching for a term that appears in content
    await page.locator('#search-input').fill('musician');
    await page.waitForTimeout(500);

    // THEN the search term should be highlighted in the excerpt
    await expect(page.locator('.search-result-excerpt mark')).toBeVisible();
  });

  test('should display multiple search results when available', async ({ page, server }) => {
    // GIVEN a Hugo site with multiple pages containing search terms
    const indexContent = `
---
title: "Home"
---
Welcome to Joe Mizzi's music site.
`;
    const aboutContent = `
---
title: "About Joe Mizzi"
---
Joe Mizzi is a musician from Chicago.
`;
    const { baseURL } = await server.start({
      indexContent,
      aboutContent,
    });
    await page.goto(`${baseURL}/search/`);
    await page.waitForLoadState('networkidle');

    // WHEN searching for a common term
    await page.locator('#search-input').fill('Joe');
    await page.waitForTimeout(500);

    // THEN multiple results should be displayed
    await expect(page.locator('.search-result')).toHaveCount(2);
  });

  test('should display no results message when no matches found', async ({ page, server }) => {
    // GIVEN a Hugo site with search functionality
    const { baseURL } = await server.start();
    await page.goto(`${baseURL}/search/`);
    await page.waitForLoadState('networkidle');

    // WHEN searching for a term that does not exist
    await page.locator('#search-input').fill('nonexistentterm12345');
    await page.waitForTimeout(500);

    // THEN a no results message should be displayed
    await expect(page.locator('.search-no-results')).toBeVisible();
  });

  test('should display helpful suggestions in no results message', async ({ page, server }) => {
    // GIVEN a Hugo site with search functionality
    const { baseURL } = await server.start();
    await page.goto(`${baseURL}/search/`);
    await page.waitForLoadState('networkidle');

    // WHEN searching for a term that does not exist
    await page.locator('#search-input').fill('xyz123');
    await page.waitForTimeout(500);

    // THEN helpful suggestions should be displayed
    await expect(page.locator('.search-suggestions')).toBeVisible();
  });

  test('should include navigation links in no results message', async ({ page, server }) => {
    // GIVEN a Hugo site with search functionality
    const { baseURL } = await server.start();
    await page.goto(`${baseURL}/search/`);
    await page.waitForLoadState('networkidle');

    // WHEN searching for a term that does not exist
    await page.locator('#search-input').fill('notfound');
    await page.waitForTimeout(500);

    // THEN navigation links should be present
    await expect(page.locator('.search-suggestions a[href="/artists/"]')).toBeVisible();
  });

  test('should clear results when search input is emptied', async ({ page, server }) => {
    // GIVEN a Hugo site with search functionality and displayed results
    const aboutContent = `
---
title: "About"
---
Joe Mizzi is a musician.
`;
    const { baseURL } = await server.start({ aboutContent });
    await page.goto(`${baseURL}/search/`);
    await page.waitForLoadState('networkidle');
    await page.locator('#search-input').fill('Mizzi');
    await page.waitForTimeout(500);

    // WHEN clearing the search input
    await page.locator('#search-input').fill('');
    await page.waitForTimeout(500);

    // THEN the results should be cleared
    await expect(page.locator('#search-results')).toBeEmpty();
  });

  test('should make result titles clickable links', async ({ page, server }) => {
    // GIVEN a Hugo site with search functionality and content
    const aboutContent = `
---
title: "About Joe"
---
Joe Mizzi is a musician.
`;
    const { baseURL } = await server.start({ aboutContent });
    await page.goto(`${baseURL}/search/`);
    await page.waitForLoadState('networkidle');

    // WHEN performing a search
    await page.locator('#search-input').fill('Joe');
    await page.waitForTimeout(500);

    // THEN the result title should be a clickable link
    await expect(page.locator('.search-result-link')).toHaveAttribute('href', '/about/');
  });

  test('should display result URLs', async ({ page, server }) => {
    // GIVEN a Hugo site with search functionality and content
    const aboutContent = `
---
title: "About"
---
Content about Joe Mizzi.
`;
    const { baseURL } = await server.start({ aboutContent });
    await page.goto(`${baseURL}/search/`);
    await page.waitForLoadState('networkidle');

    // WHEN performing a search
    await page.locator('#search-input').fill('Mizzi');
    await page.waitForTimeout(500);

    // THEN the result URL should be displayed
    await expect(page.locator('.search-result-url')).toContainText('/about/');
  });

  test('should limit results to maximum number', async ({ page, server }) => {
    // GIVEN a Hugo site with many pages containing the same term
    let indexContent = `
---
title: "Home"
---
Joe Mizzi content here.
`;
    // Create multiple pages with the same search term
    for (let i = 1; i <= 25; i++) {
      indexContent += `\n\nPage ${i} with Joe Mizzi content.`;
    }

    const { baseURL } = await server.start({ indexContent });
    await page.goto(`${baseURL}/search/`);
    await page.waitForLoadState('networkidle');

    // WHEN searching for a common term
    await page.locator('#search-input').fill('Mizzi');
    await page.waitForTimeout(500);

    // THEN results should be limited to maximum (20)
    const resultCount = await page.locator('.search-result').count();
    expect(resultCount).toBeLessThanOrEqual(20);
  });

  test('should prioritize title matches over content matches', async ({ page, server }) => {
    // GIVEN content where search term appears in different locations
    const aboutContent = `
---
title: "About"
---
This page contains information about Joe Mizzi the musician.
`;
    const mizziePageContent = `
---
title: "Joe Mizzi Biography" 
---
This is content without the search term in the body.
`;
    const { baseURL } = await server.start({
      aboutContent,
      indexContent: mizziePageContent,
    });
    await page.goto(`${baseURL}/search/`);
    await page.waitForLoadState('networkidle');

    // WHEN searching for a term that appears in both title and content
    await page.locator('#search-input').fill('Mizzi');
    await page.waitForTimeout(500);

    // THEN the page with title match should appear first
    const firstResult = page.locator('.search-result').first();
    await expect(firstResult.locator('.search-result-link')).toContainText('Joe Mizzi Biography');
  });

  test('should handle special characters in search terms', async ({ page, server }) => {
    // GIVEN content with special characters
    const aboutContent = `
---
title: "About (Music)"
---
Content about rock & roll music.
`;
    const { baseURL } = await server.start({ aboutContent });
    await page.goto(`${baseURL}/search/`);
    await page.waitForLoadState('networkidle');

    // WHEN searching with special characters
    await page.locator('#search-input').fill('rock & roll');
    await page.waitForTimeout(500);

    // THEN results should be found and displayed
    await expect(page.locator('.search-result')).toBeVisible();
  });

  test('should be case insensitive in search', async ({ page, server }) => {
    // GIVEN content with mixed case
    const aboutContent = `
---
title: "About Joe Mizzi"
---
Joe Mizzi is a MUSICIAN from Chicago.
`;
    const { baseURL } = await server.start({ aboutContent });
    await page.goto(`${baseURL}/search/`);
    await page.waitForLoadState('networkidle');

    // WHEN searching with different case
    await page.locator('#search-input').fill('musician');
    await page.waitForTimeout(500);

    // THEN results should be found regardless of case
    await expect(page.locator('.search-result')).toBeVisible();
  });

  test('should handle multi-word search queries', async ({ page, server }) => {
    // GIVEN content with multiple words
    const aboutContent = `
---
title: "About"
---
Joe Mizzi is a Chicago musician and software engineer.
`;
    const { baseURL } = await server.start({ aboutContent });
    await page.goto(`${baseURL}/search/`);
    await page.waitForLoadState('networkidle');

    // WHEN searching with multiple words
    await page.locator('#search-input').fill('Chicago musician');
    await page.waitForTimeout(500);

    // THEN results should be found and both terms highlighted
    await expect(page.locator('.search-result-excerpt mark')).toHaveCount(2);
  });

  test('should escape HTML in search queries to prevent XSS', async ({ page, server }) => {
    // GIVEN a Hugo site with search functionality
    const { baseURL } = await server.start();
    await page.goto(`${baseURL}/search/`);
    await page.waitForLoadState('networkidle');

    // WHEN searching with HTML tags
    await page.locator('#search-input').fill('<script>alert("xss")</script>');
    await page.waitForTimeout(500);

    // THEN the HTML should be escaped in the no results message
    await expect(page.locator('.search-no-results')).toContainText('<script>alert("xss")</script>');
  });

  test('should show fallback content when JavaScript is disabled', async ({ page, server }) => {
    // GIVEN a Hugo site with search functionality and JavaScript disabled
    const { baseURL } = await server.start();
    await page.addInitScript(() => {
      Object.defineProperty(window, 'fetch', { value: undefined });
    });

    // WHEN visiting the search page
    await page.goto(`${baseURL}/search/`);

    // THEN noscript fallback content should be visible
    await expect(page.locator('noscript')).toBeAttached();
  });

  test('should clear results when valid term is modified to invalid term', async ({ page, server }) => {
    // GIVEN content that contains a common word like "the"
    const aboutContent = `
---
title: "About"
---
Joe Mizzi is the musician from Chicago.
`;
    const indexContent = `
---
title: "Home"
---
Welcome to the music site featuring Joe Mizzi.
`;
    const { baseURL } = await server.start({
      aboutContent,
      indexContent,
    });
    await page.goto(`${baseURL}/search/`);
    await page.waitForLoadState('networkidle');

    // WHEN searching for a valid term that returns results
    await page.locator('#search-input').fill('the');
    await page.waitForTimeout(500);
    await page.locator('#search-input').fill('theasdf');
    await page.waitForTimeout(500);

    // THEN the search results should be cleared and no results message shown
    await expect(page.locator('.search-result')).toHaveCount(0);
  });
});
