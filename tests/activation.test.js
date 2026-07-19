import { test, expect } from './fixtures.js';

const test_page_url = new URL('./pages/activation.html', import.meta.url).href;

test('activating a hint by number clicks the hinted element', async ({ context, service_worker }) => {
  const page = await context.newPage();
  await page.goto(test_page_url, { waitUntil: 'domcontentloaded' });

  // No show-hints command is issued: the background runs the
  // configured startingCommand on frame 0's CBV_HELLO (background.js),
  // and that shows hints by default.  Issuing our own would create a
  // second epoch, and each epoch renumbers every frame from zero --
  // leaving a window in which the number just read is already stale.
  //
  // The page has exactly one hintable element, so every element
  // carrying CBV_hint_tag names that element.  (There may be more than
  // one carrier: an overlay marker's outer and inner elements are both
  // tagged.)  Hints arrive asynchronously, but with a single epoch the
  // numbers do not change once assigned.
  let hint_tags;
  await expect.poll(async () => {
    hint_tags = await page.locator('[CBV_hint_tag]').evaluateAll(
        (elements) => elements.map((element) => element.getAttribute('CBV_hint_tag')));
    return hint_tags.length;
  }).toBeGreaterThan(0);

  const hint_numbers = [...new Set(hint_tags)];
  expect(hint_numbers.length).toBe(1);

  await service_worker.evaluate((text) => do_user_command(text),
                                hint_numbers[0] + ':c');

  // Activation highlights the element for 250 ms before clicking, so
  // poll rather than assert immediately.
  await expect.poll(() => page.evaluate(() => window.clicks)).toEqual(['target_button']);
});
