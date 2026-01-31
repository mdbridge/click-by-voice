Files injected into webpages (content scripts).

The main file is content_script.js.  The other files provide
functionality for it to call/CSS for the DOM changes it makes.

None of these files are used by the other extension components (e.g.,
the service worker or options page).

Because content scripts in manifest version 3 extensions cannot use ES6
modules, the non-main files here use hand-rolled modules.


Note: we only inject the minified version of jQuery, but I have checked
in the non-minified version for possible future debugging.
