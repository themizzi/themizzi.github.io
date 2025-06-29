import { test as base, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import getPort from 'get-port';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const THEME_SOURCE_DIR = path.join(__dirname, '..', '..');
const DEBUG_MODE = process.env.DEBUG_TESTS === 'true';

// Server fixture interface
interface ServerFixture {
  start: (config?: TestSiteConfig) => Promise<{ baseURL: string }>;
}

// Test fixtures
interface TestFixtures {
  server: ServerFixture;
}

interface TestSiteConfig {
  params?: string;
  indexContent?: string;
}

interface TestSite {
  tmpDir: string;
  port: number;
  cleanup: () => void;
}

interface ServerControl {
  port: number;
  baseURL: string;
  stop: () => void;
}

async function createTestSite(config: TestSiteConfig = {}): Promise<TestSite> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hugo-theme-test-'));

  fs.mkdirSync(path.join(tmpDir, 'config'));
  fs.mkdirSync(path.join(tmpDir, 'config', '_default'));

  const port = await getPort();
  const defaultConfig = {
    baseURL: `http://localhost:${port}`,
    languageCode: 'en-us',
    title: 'Theme Test Site',
  };

  const hugoConfig = Object.entries(defaultConfig)
    .map(([key, value]) => `${key} = "${value}"`)
    .join('\n');

  fs.writeFileSync(path.join(tmpDir, 'config', '_default', 'hugo.toml'), hugoConfig);

  // Write params.toml if provided
  if (config.params) {
    fs.writeFileSync(path.join(tmpDir, 'config', '_default', 'params.toml'), config.params);
  }

  // Create content directory and files if provided
  if (config.indexContent) {
    fs.mkdirSync(path.join(tmpDir, 'content'));
    fs.writeFileSync(path.join(tmpDir, 'content', '_index.md'), config.indexContent);
  }

  return {
    tmpDir,
    port,
    cleanup: () => {
      if (!DEBUG_MODE) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
      else {
        console.log(`Debug mode: Test site preserved at ${tmpDir}`);
      }
    },
  };
};

async function startHugoServer(testSite: TestSite): Promise<ServerControl> {
  return new Promise((resolve, reject) => {
    const server = spawn('hugo', [
      'server',
      '--disableFastRender',
      '--ignoreCache',
      '--port', testSite.port.toString(),
      '--bind', '127.0.0.1',
      '--theme', 'mizzi',
      '--themesDir', THEME_SOURCE_DIR,
    ], {
      cwd: testSite.tmpDir,
      stdio: 'pipe',
    });

    let serverStarted = false;

    server.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      console.log(`Hugo server output: ${output}`);

      // Look for indication that server has started
      if (output.includes('Web Server is available at') || output.includes('Press Ctrl+C to stop')) {
        if (!serverStarted) {
          serverStarted = true;
          resolve({
            port: testSite.port,
            baseURL: `http://localhost:${testSite.port}`,
            stop: () => {
              server.kill();
            },
          });
        }
      }
    });

    server.stderr?.on('data', (data: Buffer) => {
      console.error(`Hugo server error: ${data}`);
    });

    server.on('error', (error: Error) => {
      reject(error);
    });

    server.on('exit', (code: number | null) => {
      if (code !== 0 && !serverStarted) {
        reject(new Error(`Hugo server exited with code ${code}`));
      }
    });
  });
}

// Global cleanup tracking
const activeServers: ServerControl[] = [];
const activeTestSites: TestSite[] = [];

// Extended test with server fixture
const test = base.extend<TestFixtures>({
  // eslint-disable-next-line no-empty-pattern
  server: async ({ }, use) => {
    const serverFixture: ServerFixture = {
      start: async (config: TestSiteConfig = {}) => {
        const testSite = await createTestSite(config);
        const serverControl = await startHugoServer(testSite);

        // Track for cleanup
        activeTestSites.push(testSite);
        activeServers.push(serverControl);

        return { baseURL: serverControl.baseURL };
      },
    };

    await use(serverFixture);
  },
});

// Global cleanup
test.afterEach(async () => {
  // Stop all servers
  for (const server of activeServers) {
    server.stop();
  }

  // Cleanup all test sites
  for (const site of activeTestSites) {
    site.cleanup();
  }

  // Clear tracking arrays
  activeServers.length = 0;
  activeTestSites.length = 0;
});

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
