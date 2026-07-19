import { test, expect } from './fixtures.js';

test('extension loads and registers its service worker', async ({ service_worker }) => {
  expect(service_worker.url()).toMatch(/^chrome-extension:\/\/[a-p]{32}\/background\/background\.js$/);
});
