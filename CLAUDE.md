This is a Chrome manifest version 3 extension.

Major components (each has a subdirectory):
  * content_scripts
    * the files injected into each webpage
  * background
    * the service worker that handles incoming user requests, most
      extension browser-session state, and other things like support
      access that content scripts can't handle under MV3
  * popup
    * the files that handle the pop-up dialog box when the user manually invokes us
  * options
    * the files that handle the extensions options dialogue box, storing of options

Each component has a README.txt file that you may find helpful.



Code conventions:
  - all components except content_scripts use ES6 modules
    - when using ES6 modules, mark functions as exported by using the export
      keyword directly on the function
  - the content scripts use hand-rolled modules; examine
    content_scripts/utilities.js to see the conventions there.

  - the main files (background.js, content_script.js) call other files;
    other files should not be calling them.

  - // <<<>>> comments mark items that need review/consideration - don't remove them
  - inside content_scripts, use Util.vlog(level)(message) for verbose logging


Miscellaneous:
  - Git commands: Use `git -C $(HOME)/infra/click_by_voice` prefix if needed.
