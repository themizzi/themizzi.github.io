import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import getPort from 'get-port';
import { test as base } from '@playwright/test';
import { PaginatedPageFixture } from './fixtures/pagination.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const SITE_SOURCE_DIR = path.join(__dirname, '..');
export const DEBUG_MODE = process.env.DEBUG_TESTS === 'true';

export interface TestSiteConfig {
  params?: string;
  indexContent?: string;
  aboutContent?: string;
  searchContent?: string;
  images?: string[]; // Array of image names to create
  hugoConfig?: string; // Custom Hugo configuration
  contentFiles?: Record<string, string>; // Additional content files
  layoutFiles?: Record<string, string>; // Additional layout files
}

export interface TestSite {
  tmpDir: string;
  port: number;
  cleanup: () => void;
}

export interface ServerControl {
  port: number;
  baseURL: string;
  stop: () => void;
}

// Server fixture interface
export interface ServerFixture {
  start: (config?: TestSiteConfig) => Promise<{ baseURL: string }>;
}

// Test fixtures
export interface TestFixtures {
  server: ServerFixture;
  paginatedPage: PaginatedPageFixture;
}

// Global cleanup tracking
const activeServers: ServerControl[] = [];
const activeTestSites: TestSite[] = [];

// Extended test with server fixture
export const test = base.extend<TestFixtures>({
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

  paginatedPage: async ({ page, server }, use) => {
    const paginatedPage = new PaginatedPageFixture(page, server);
    await use(paginatedPage);
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

export async function createTestSite(config: TestSiteConfig = {}): Promise<TestSite> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hugo-theme-test-'));

  for (const sourceDir of ['assets', 'data', 'layouts', 'static']) {
    const sourcePath = path.join(SITE_SOURCE_DIR, sourceDir);
    const targetPath = path.join(tmpDir, sourceDir);

    if (fs.existsSync(sourcePath)) {
      fs.cpSync(sourcePath, targetPath, { recursive: true });
    }
  }

  fs.mkdirSync(path.join(tmpDir, 'config'));
  fs.mkdirSync(path.join(tmpDir, 'config', '_default'));

  const port = await getPort();
  const defaultConfig = {
    baseURL: `http://localhost:${port}`,
    languageCode: 'en-us',
    title: 'Theme Test Site',
  };

  // Use custom Hugo config if provided, otherwise use default
  const hugoConfigContent = config.hugoConfig || Object.entries(defaultConfig)
    .map(([key, value]) => `${key} = "${value}"`)
    .join('\n');

  // Add search index configuration
  const searchConfig = `
[outputFormats]
  [outputFormats.SearchIndex]
    mediaType = "application/json"
    baseName = "search-index"
    isPlainText = true
    notAlternative = true

[outputs]
  home = ["HTML", "RSS", "SearchIndex"]
`;

  fs.writeFileSync(path.join(tmpDir, 'config', '_default', 'hugo.toml'), hugoConfigContent + searchConfig);

  // Write params.toml if provided
  if (config.params) {
    fs.writeFileSync(path.join(tmpDir, 'config', '_default', 'params.toml'), config.params);
  }

  // Create content directory
  fs.mkdirSync(path.join(tmpDir, 'content'));

  // Create assets/images directory for image tests
  fs.mkdirSync(path.join(tmpDir, 'assets'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'assets', 'images'), { recursive: true });

  // Create index content if provided
  if (config.indexContent) {
    fs.writeFileSync(path.join(tmpDir, 'content', '_index.md'), config.indexContent);
  }

  // Create about page content if provided
  if (config.aboutContent) {
    fs.writeFileSync(path.join(tmpDir, 'content', 'about.md'), config.aboutContent);
  }

  // Create search page content (always create for search tests)
  const searchContent = config.searchContent || `+++
title = "Search"
layout = "search"
+++
`;
  fs.writeFileSync(path.join(tmpDir, 'content', 'search.md'), searchContent);

  // Create test images if provided
  if (config.images) {
    for (const imageName of config.images) {
      createTestImage({ tmpDir, port, cleanup: () => { /* no-op for temporary test site */ } }, imageName);
    }
  }

  // Create additional content files if provided
  if (config.contentFiles) {
    for (const [relativePath, content] of Object.entries(config.contentFiles)) {
      const fullPath = path.join(tmpDir, 'content', relativePath);
      const dir = path.dirname(fullPath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fullPath, content);
    }
  }

  // Create additional layout files if provided
  if (config.layoutFiles) {
    fs.mkdirSync(path.join(tmpDir, 'layouts'), { recursive: true });
    for (const [relativePath, content] of Object.entries(config.layoutFiles)) {
      const fullPath = path.join(tmpDir, 'layouts', relativePath);
      const dir = path.dirname(fullPath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fullPath, content);
    }
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
}

export async function startHugoServer(testSite: TestSite): Promise<ServerControl> {
  return new Promise((resolve, reject) => {
    const server = spawn('hugo', [
      'server',
      '--disableFastRender',
      '--ignoreCache',
      '--port', testSite.port.toString(),
      '--bind', '127.0.0.1',
    ], {
      cwd: testSite.tmpDir,
      stdio: 'pipe',
    });

    let serverStarted = false;

    server.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      if (DEBUG_MODE) {
        console.log(`Hugo server output: ${output}`);
      }

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
      if (DEBUG_MODE) {
        console.error(`Hugo server error: ${data}`);
      }
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

// Create a simple test PNG image (1x1 pixel)
export function createTestImageBuffer(): Buffer {
  return Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
    0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,
  ]);
}

export function createTestImage(testSite: TestSite, imageName: string): void {
  const imageBuffer = createTestImageBuffer();
  fs.writeFileSync(path.join(testSite.tmpDir, 'assets', 'images', imageName), imageBuffer);
}
