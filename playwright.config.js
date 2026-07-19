import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // Every test launches its own headed Chrome with the unpacked
  // extension, which dominates the cost of a run.  Playwright's
  // default worker count scales with CPU count and oversubscribes
  // badly here: the launches contend rather than making progress, and
  // since setup counts against the per-test timeout, tests start
  // timing out before their page is ever hinted.  A low fixed cap
  // avoids that, and costs nothing -- the suite stops getting faster
  // at about this many workers regardless of how many CPUs exist.
  workers: 4,

  // Must cover fixture setup (the browser launch above), not just the
  // test body, so it needs room for a cold start on a slow machine.
  timeout: 30000,
});
