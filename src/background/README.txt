Files for implementing the service worker that runs in the background.

These files use ES6 modules.


Main files:
  background.js 
    - entry point; handles keyboard shortcuts and messages from content
      scripts (e.g., hint allocation, opening tabs, clipboard
      operations)
  background_utilities.js 
    - utilities for sending commands to content scripts and allocating
      hint number batches
  background_persistence.js 
    - preserves state across service worker idle/restart cycles using
      session storage

Clipboard access (MV3 requires an offscreen document workaround):
  background_clipboard.js
    - clipboard API for the service worker
  background_clipboard_offscreen.js/html 
    - offscreen document that performs actual clipboard read/write
