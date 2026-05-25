import { expect } from '@playwright/test';
import { test } from './fixtures.js';

test.describe('Image Shortcode', () => {
  test('should render img shortcode with valid image from assets', async ({ page, server }) => {
    // GIVEN
    const aboutContent = `+++
title = 'About'
+++

# About

This is a test page with an image shortcode.

{{< img src="images/test-image.png" alt="Test image description" >}}
`;

    const { baseURL } = await server.start({
      aboutContent,
      images: ['test-image.png'],
    });

    // WHEN
    await page.goto(`${baseURL}/about/`);

    // THEN
    await expect(page.locator('img[alt="Test image description"][src^="/images/test-image"]')).toBeVisible();
  });

  test('should handle missing image gracefully', async ({ page, server }) => {
    // GIVEN
    const aboutContent = `+++
title = 'About'
+++

# About

This is a test page with a missing image shortcode.

{{< img src="images/nonexistent.png" alt="Missing image" >}}
`;

    const { baseURL } = await server.start({ aboutContent });

    // WHEN
    await page.goto(`${baseURL}/about/`);

    // THEN
    await expect(page.locator('img[alt="Missing image"]')).toHaveCount(0);
  });

  test('should properly escape HTML in alt text', async ({ page, server }) => {
    // GIVEN
    const aboutContent = `+++
title = 'About'
+++

# About

Testing HTML escaping in alt text.

{{< img src="images/test-image.png" alt="Image with <script>alert('xss')</script> in alt" >}}
`;

    const { baseURL } = await server.start({
      aboutContent,
      images: ['test-image.png'],
    });

    // WHEN
    await page.goto(`${baseURL}/about/`);

    // THEN
    await expect(page.locator('img[alt="Image with <script>alert(\'xss\')</script> in alt"]')).toBeVisible();
  });
});
