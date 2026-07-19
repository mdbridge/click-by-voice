import { test, expect } from './fixtures.js';

const test_page_url = new URL('./pages/activation.html', import.meta.url).href;

test('activating a hint by number clicks the hinted element', async ({ context, service_worker }) => {
  const page = await context.newPage();
  await page.goto(test_page_url, { waitUntil: 'domcontentloaded' });

  await service_worker.evaluate((text) => do_user_command(text), ':+');

  // The page has exactly one hintable element, so every element
  // carrying CBV_hint_tag names that element's hint number.  (There
  // may be more than one carrier: an overlay marker's outer and
  // inner elements are both tagged.)
  const hints = page.locator('[CBV_hint_tag]');
  function get_hint_tags() {
    return hints.evaluateAll(
        (elements) => elements.map((element) => element.getAttribute('CBV_hint_tag')));
  }

  // Hint numbers are not guaranteed stable across epochs, and page
  // startup (CBV_HELLO) may re-show hints shortly after our ':+'
  // does.  Sample until two snapshots 200 ms apart agree, so the
  // number we activate comes from the settled, current epoch.
  let hint_tags;
  await expect.poll(async () => {
    const earlier_sample = await get_hint_tags();
    await page.waitForTimeout(200);
    hint_tags = await get_hint_tags();
    return hint_tags.length > 0 &&
           hint_tags.length === earlier_sample.length &&
           hint_tags.every((tag, index) => tag === earlier_sample[index]);
  }).toBe(true);

  const hint_numbers = [...new Set(hint_tags)];
  expect(hint_numbers.length).toBe(1);

  await service_worker.evaluate((text) => do_user_command(text),
                                hint_numbers[0] + ':c');

  // Activation highlights the element for 250 ms before clicking, so
  // poll rather than assert immediately.
  await expect.poll(() => page.evaluate(() => window.clicks)).toEqual(['target_button']);
});
