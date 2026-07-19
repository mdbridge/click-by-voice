import { test, expect } from './fixtures.js';

const test_page_url = new URL('./pages/iframe_parent.html', import.meta.url).href;

// activation.test.js in miniature, with the target element one frame
// down: a hint number owned by a child frame must activate the element
// in that frame.  What differs from the single-frame case is that the
// child's hints come from its own content-script instance and its own
// hint batch.  The child is cross-origin (Chrome gives each file:// page
// its own opaque origin) for realism only -- the DOM walk never descends
// into a frame regardless of origin, so a same-origin child would take
// the same path.
//
// No ":+" command is issued here.  The default startingCommand is ":+"
// (options/option_storage.js), which the background runs on frame 0's
// CBV_HELLO (background.js), so hints appear on their own.  Issuing our
// own would create a second epoch, and each epoch renumbers every frame
// from zero -- leaving a window in which the number just read is already
// stale.  Letting the page's own startup be the only epoch removes that
// race rather than papering over it with polling.
test('a hint owned by a cross-origin child frame activates in that frame',
     async ({ context, service_worker }) => {
  const page = await context.newPage();
  await page.goto(test_page_url, { waitUntil: 'domcontentloaded' });

  let child_frame;
  await expect.poll(() => {
    child_frame = page.frames().find((frame) => frame.url().includes('iframe_child'));
    return Boolean(child_frame);
  }).toBe(true);

  // The child frame holds exactly one hintable element, so every
  // element there carrying CBV_hint_tag names that element.  (There may
  // be more than one carrier: an overlay marker's outer and inner
  // elements are both tagged.)  Hints arrive asynchronously, but with a
  // single epoch the numbers do not change once assigned.
  let child_tags;
  await expect.poll(async () => {
    child_tags = await child_frame.locator('[CBV_hint_tag]').evaluateAll(
        (elements) => elements.map((element) => element.getAttribute('CBV_hint_tag')));
    return child_tags.length;
  }).toBeGreaterThan(0);

  const child_numbers = [...new Set(child_tags)];
  expect(child_numbers.length).toBe(1);

  await service_worker.evaluate((text) => do_user_command(text),
                                child_numbers[0] + ':c');

  // Activation highlights the element for 250 ms before clicking, so
  // poll rather than assert immediately.
  await expect.poll(() => child_frame.evaluate(() => window.clicks))
      .toEqual(['child_button']);
  expect(await page.evaluate(() => window.clicks)).toEqual([]);
});
