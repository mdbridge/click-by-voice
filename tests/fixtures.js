import { test as base, chromium } from '@playwright/test';
import { fileURLToPath } from 'url';

// The extension root is src/
const extension_path = fileURLToPath(new URL('../src', import.meta.url));

const test = base.extend({
  context: async ({}, use) => {
    const browser_context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extension_path}`,
        `--load-extension=${extension_path}`,
      ],
    });
    await use(browser_context);
    await browser_context.close();
  },

  service_worker: async ({ context }, use) => {
    let worker = context.serviceWorkers()[0];
    if (!worker) {
      worker = await context.waitForEvent('serviceworker');
    }
    await use(worker);
  },
});

const expect = test.expect;

export { test, expect };
