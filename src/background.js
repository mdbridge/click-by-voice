//
// Main file for extension service worker.
//
// Note that console messages from the service worker show up in the
// console for the service worker, not the webpage.
//

import * as clipboard      from './background_clipboard.js';
import { do_user_command } from './background-utilities.js';
import * as option_storage from './option_storage.js';


//
// Shortcut keyboard commands except for _execute_action
//

chrome.commands.onCommand.addListener(async function(command) {
    if (command == "blur") {
        console.log('CBV: Bluring...');
        do_user_command(":blur", false);

    } else if (command == "execute_command_from_clipboard") {
        const input        = await clipboard.getClipboard();
        let   command_text = input;
        const match        = input.match(/^(.*?)!!!([\s\S]*)/m);
        if (match) {
            command_text = match[1];
            await clipboard.putClipboard(match[2]);
        }
        console.log(`CBV Command: "${command_text}"`);
        do_user_command(command_text, false);
    } else {
        console.error(`Unexpected keyboard shortcut name received by CBV: ${command}`);
    }
});


//
// Performing actions on behalf of the content script
//

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // In order to keep the connection open long enough for the
    // response to be received, we need to return true from the callback.
    // (Otherwise, the service worker may go away before the
    // content script is able to read the response.  :-( )  This cannot
    // be done using an async callback, so we need to do a bit of
    // kludging.  For simplicity, we just always return a response.
    (async () => {
        try {
            switch (request.action) {

                /*
                 * Accessing extension option storage
                 */
            case "get_per_session_options":
                const options = await option_storage.get_per_session_options();
                sendResponse(options);
                break;
            case "set_initial_operation":
                let setOptions = await option_storage.get_per_session_options();
                setOptions.startingCommand = request.initial_operation;
                await option_storage.put_per_session_options(setOptions);
                console.log("initial_operation is now: " + request.initial_operation);
                sendResponse({ status: "success" });
                break;

                /*
                 * Opening URLs in a new tab/window
                 */
            case "create_tab":
                chrome.tabs.create({
                    url: request.URL,
                    active: request.active,
                    // open new tab immediately to right of current one:
                    index: sender.tab.index + 1
                }, () => sendResponse({ status: "tab created" }));
                break;
            case "create_window":
                chrome.windows.create({ url: request.URL }, 
                                      () => sendResponse({ status: "window created" }));
                break;

                /*
                 * Copying text to the clipboard
                 */
            case "copy_to_clipboard":
                await clipboard.putClipboard(request.text);
                sendResponse({ status: "text copied" });
                break;

            default:
                console.log("unknown action: " + request.action);
                sendResponse({ error: "unknown action" });
            }
        } catch (error) {
            console.error(error);
            sendResponse({ error: error.message });
        }
  })();

  // Return true to indicate that the response is sent asynchronously
  return true;
});
