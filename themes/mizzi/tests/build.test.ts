import { expect } from '@playwright/test';
import { test } from './fixtures.js';

test.describe('Hugo Theme Tests', () => {
  test('should serve the theme homepage correctly', async ({ page, server }) => {
    // GIVEN a basic Hugo site
    const { baseURL } = await server.start();

    // WHEN visiting the homepage
    await page.goto(baseURL);

    // THEN it should have the correct title
    await expect(page).toHaveTitle(/Theme Test Site/);
  });
});

test.describe('Mastodon Link Configuration', () => {
  test('should include Mastodon rel=me link when configured', async ({ page, server }) => {
    // GIVEN a site with mastodon_url configured
    const paramsConfig = `
mastodon_url = "https://mastodon.social/@testuser"

[author]
  name = "Test User"
  email = "test@example.com"
`;
    const { baseURL } = await server.start({ params: paramsConfig });

    // WHEN visiting the homepage
    await page.goto(baseURL);

    // THEN the page should include the Mastodon rel=me link
    const mastodonLink = page.locator('link[rel="me"]');
    await expect(mastodonLink).toHaveAttribute('href', 'https://mastodon.social/@testuser');
  });

  test('should not include Mastodon rel=me link when not configured', async ({ page, server }) => {
    // GIVEN a site without mastodon_url configured
    const paramsConfig = `
[author]
  name = "Test User"
  email = "test@example.com"
`;
    const { baseURL } = await server.start({ params: paramsConfig });

    // WHEN visiting the homepage
    await page.goto(baseURL);

    // THEN the page should not include any Mastodon rel=me link
    const mastodonLink = page.locator('link[rel="me"]');
    await expect(mastodonLink).toHaveCount(0);
  });
});

test.describe('Home Page Content Rendering', () => {
  test('should render content from _index.md in bio section', async ({ page, server }) => {
    // GIVEN a site with content in _index.md
    const indexContent = `+++
title = "Test Site"
description = "A test site for theme testing"
+++

This is the main content that should appear in the bio section.

Visit my [website](https://example.com) for more info.
`;
    const { baseURL } = await server.start({ indexContent });

    // WHEN visiting the homepage
    await page.goto(baseURL);

    // THEN the bio section should be present and contain the content
    const bioSection = page.locator('.bio-section');
    await expect(bioSection).toBeVisible();

    // Check that the main content text is rendered
    await expect(bioSection).toContainText('This is the main content that should appear in the bio section.');

    // Check that the link is rendered correctly
    const link = bioSection.locator('a[href="https://example.com"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('website');
  });

  test('should not render bio section when _index.md has no content', async ({ page, server }) => {
    // GIVEN a site with an empty _index.md (only frontmatter)
    const indexContent = `+++
title = "Test Site"
description = "A test site for theme testing"
+++
`;
    const { baseURL } = await server.start({ indexContent });

    // WHEN visiting the homepage
    await page.goto(baseURL);

    // THEN the bio section should not be present
    const bioSection = page.locator('.bio-section');
    await expect(bioSection).toHaveCount(0);
  });

  test('should not render bio section when no _index.md exists', async ({ page, server }) => {
    // GIVEN a site with no _index.md file
    const { baseURL } = await server.start({});

    // WHEN visiting the homepage
    await page.goto(baseURL);

    // THEN the bio section should not be present
    const bioSection = page.locator('.bio-section');
    await expect(bioSection).toHaveCount(0);
  });
});
