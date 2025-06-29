import { test, expect } from '@playwright/test';
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

async function createTestSite(): Promise<TestSite> {
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

test.describe('Hugo Theme Tests', () => {
  let testSite: TestSite;
  let serverControl: ServerControl;

  test.beforeEach(async () => {
    testSite = await createTestSite();
    serverControl = await startHugoServer(testSite);
  });

  test.afterEach(async () => {
    testSite.cleanup();
    serverControl.stop();
  });

  test('should serve the theme homepage correctly', async ({ page }) => {
    // WHEN
    await page.goto(serverControl.baseURL);

    // THEN
    await expect(page).toHaveTitle(/Theme Test Site/);
  });
});

test.describe('Mastodon Link Configuration', () => {
  let testSite: TestSite;
  let serverControl: ServerControl;

  test.afterEach(async () => {
    testSite?.cleanup();
    serverControl?.stop();
  });

  test('should include Mastodon rel=me link when mastodon_url is configured', async ({ page }) => {
    // GIVEN a site with mastodon_url configured
    testSite = await createTestSite();

    const paramsConfig = `
mastodon_url = "https://mastodon.social/@testuser"

[author]
  name = "Test User"
  email = "test@example.com"
`;

    fs.writeFileSync(path.join(testSite.tmpDir, 'config', '_default', 'params.toml'), paramsConfig);
    serverControl = await startHugoServer(testSite);

    // WHEN visiting the homepage
    await page.goto(serverControl.baseURL);

    // THEN the page should include the Mastodon rel=me link
    const mastodonLink = page.locator('link[rel="me"]');
    await expect(mastodonLink).toHaveAttribute('href', 'https://mastodon.social/@testuser');
  });

  test('should not include Mastodon rel=me link when mastodon_url is not configured', async ({ page }) => {
    // GIVEN a site without mastodon_url configured
    testSite = await createTestSite();

    const paramsConfig = `
[author]
  name = "Test User"
  email = "test@example.com"
`;

    fs.writeFileSync(path.join(testSite.tmpDir, 'config', '_default', 'params.toml'), paramsConfig);
    serverControl = await startHugoServer(testSite);

    // WHEN visiting the homepage
    await page.goto(serverControl.baseURL);

    // THEN the page should not include any Mastodon rel=me link
    const mastodonLink = page.locator('link[rel="me"]');
    await expect(mastodonLink).toHaveCount(0);
  });
});
