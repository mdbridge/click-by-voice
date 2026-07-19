import { test, expect } from './fixtures.js';

const test_page_url =
    new URL('../test_pages/activatable_elements.html', import.meta.url).href;

test('hints appear on a page with activatable elements', async ({ context, service_worker }) => {
  const page = await context.newPage();
  // domcontentloaded: hinting does not require the load event, and the
  // test page references external media that could stall it.
  await page.goto(test_page_url, { waitUntil: 'domcontentloaded' });

  await service_worker.evaluate((text) => do_user_command(text), ':+');

  const hints = page.locator('[CBV_hint_tag]');

  // Poll and then check digits on the same snapshot, so the digit
  // check cannot run against a transient empty window mid-refresh.
  let hint_tags;
  await expect.poll(async () => {
    hint_tags = await hints.evaluateAll(
        (elements) => elements.map((element) => element.getAttribute('CBV_hint_tag')));
    return hint_tags.length;
  }).toBeGreaterThanOrEqual(10);

  for (const tag of hint_tags) {
    expect(tag).toMatch(/^[0-9]+$/);
  }
});
