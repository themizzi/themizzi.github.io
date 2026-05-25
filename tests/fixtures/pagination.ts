import { Locator, Page } from '@playwright/test';
import { ServerFixture } from '../fixtures.js';

export interface PaginatedPageOptions {
  pagerSize?: number;
  maxPaginationPages?: number;
}

export class PaginatedPageFixture {
  public baseURL = '';

  constructor(
    private page: Page,
    private server: ServerFixture,
  ) {}

  async createWithItems(count: number, options: PaginatedPageOptions = {}): Promise<void> {
    const { pagerSize = 10, maxPaginationPages = 5 } = options;

    // Generate Hugo site configuration with pagination settings
    const hugoConfig = `
baseURL = "http://localhost"
title = "Test Site"
languageCode = "en-us"

[pagination]
  pagerSize = ${pagerSize}
  path = "page"
  disableAliases = false
`;

    // Generate content files
    const contentFiles: Record<string, string> = {};

    // Create section index with maxPaginationPages parameter
    contentFiles['test-section/_index.md'] = `---
title: "Test Section"
maxPaginationPages: ${maxPaginationPages}
---

Test section for pagination.
`;

    // Create individual content items
    for (let i = 1; i <= count; i++) {
      const paddedNum = i.toString().padStart(2, '0');

      // Generate valid dates by cycling through months and days
      const month = Math.floor((i - 1) / 28) + 1; // Use 28 days per month to avoid issues
      const day = ((i - 1) % 28) + 1;
      const paddedMonth = month.toString().padStart(2, '0');
      const paddedDay = day.toString().padStart(2, '0');

      contentFiles[`test-section/item-${paddedNum}.md`] = `---
title: "Test Item ${i}"
date: 2024-${paddedMonth}-${paddedDay}T10:00:00Z
---

Content for test item ${i}.
`;
    }

    // Create test section template
    const sectionTemplate = `{{ define "main" }}
<div class="container">
    <h1>{{ .Title }}</h1>
    
    {{ range .Paginator.Pages }}
    <div class="item">{{ .Title }}</div>
    {{ end }}
    
    {{ partial "pagination.html" . }}
</div>
{{ end }}`;

    // Start server with generated content
    const { baseURL } = await this.server.start({
      hugoConfig,
      contentFiles,
      layoutFiles: {
        'test-section/section.html': sectionTemplate,
      },
    });

    this.baseURL = baseURL;
  }

  getPaginationContainer(): Locator {
    return this.page.locator('nav.pagination');
  }

  getFirstPageLink(): Locator {
    return this.page.locator('nav.pagination a[aria-label="First page"]');
  }

  getFirstPageDisabled(): Locator {
    return this.page.locator('nav.pagination span.disabled[aria-label="First page"]');
  }

  getPreviousPageLink(): Locator {
    return this.page.locator('nav.pagination a[aria-label="Previous page"]');
  }

  getPreviousPageDisabled(): Locator {
    return this.page.locator('nav.pagination span.disabled[aria-label="Previous page"]');
  }

  getNextPageLink(): Locator {
    return this.page.locator('nav.pagination a[aria-label="Next page"]');
  }

  getNextPageDisabled(): Locator {
    return this.page.locator('nav.pagination span.disabled[aria-label="Next page"]');
  }

  getLastPageLink(): Locator {
    return this.page.locator('nav.pagination a[aria-label="Last page"]');
  }

  getLastPageDisabled(): Locator {
    return this.page.locator('nav.pagination span.disabled[aria-label="Last page"]');
  }

  getCurrentPageIndicator(): Locator {
    return this.page.locator('nav.pagination span.current');
  }

  getPageNumberLink(pageNumber: number): Locator {
    return this.page.locator(`nav.pagination a:has-text("${pageNumber}")`);
  }

  getInvisibleSpans(): Locator {
    return this.page.locator('nav.pagination span.invisible');
  }

  getInvisibleSpansBeforeCurrentPage(): Locator {
    // Find invisible spans that appear before the current page in the pagination list
    // The current page "1" is at position 5, so we want invisible spans at positions 3 and 4
    return this.page.locator('nav.pagination li:nth-child(3) span.invisible, nav.pagination li:nth-child(4) span.invisible');
  }

  getInvisibleSpansAfterCurrentPage(): Locator {
    // Find invisible spans that appear after the current page in the pagination list
    // The current page li can be found with li:has(span.current)
    // We want invisible spans in li elements that come after this element
    return this.page.locator('nav.pagination li:has(span.current) ~ li span.invisible');
  }

  getAllPageElements(): Locator {
    return this.page.locator('nav.pagination li:has(a:not([aria-label])), nav.pagination li:has(span.current)');
  }

  getAllPageIndicators(): Locator {
    return this.page.locator('nav.pagination li a:not([aria-label]), nav.pagination li span.current, nav.pagination li span.invisible');
  }

  /**
   * Navigate to a specific page in the test section
   * @param pageNumber The page number to navigate to (1-based)
   */
  async goToPage(pageNumber: number): Promise<void> {
    if (pageNumber === 1) {
      // First page doesn't have /page/1/ in URL
      await this.page.goto(`${this.baseURL}/test-section/`);
    }
    else {
      await this.page.goto(`${this.baseURL}/test-section/page/${pageNumber}/`);
    }
  }

  /**
   * Click the previous page link
   */
  async clickPreviousPageLink(): Promise<void> {
    const previousPageLink = this.getPreviousPageLink();
    await previousPageLink.click();
  }

  /**
   * Click the next page link
   */
  async clickNextPageLink(): Promise<void> {
    const nextPageLink = this.getNextPageLink();
    await nextPageLink.click();
  }

  /**
   * Click a numbered page link
   * @param pageNumber The page number to click (1-based)
   */
  async clickPageNumberLink(pageNumber: number): Promise<void> {
    const pageLink = this.getPageNumberLink(pageNumber);
    await pageLink.click();
  }

  getCurrentPage() {
    const url = this.page.url();
    const match = url.match(/\/page\/(\d+)\//);
    return match ? parseInt(match[1], 10) : 1;
  }
}
