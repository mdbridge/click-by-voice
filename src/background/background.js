//
// Main file for extension service worker.
//
// Note that console messages from the service worker show up in the
// console for the service worker, not the webpage.
//

import * as clipboard            from './background_clipboard.js';
import * as background_utilities from './background_utilities.js';
import * as option_storage       from '../options/option_storage.js';


//
// Shortcut keyboard commands except for _execute_action
//

chrome.commands.onCommand.addListener(async function(command) {
    if (command == "blur") {
        await background_utilities.do_user_command(":blur");

    } else if (command == "execute_command_from_clipboard") {
        const input        = await clipboard.getClipboard();
        let   command_text = input;
        // allow !!!<new_clipboard> at end so clipboard can be preserved:
        const match        = input.match(/^(.*?)!!!([\s\S]*)/m);
        if (match) {
            command_text = match[1];
            await clipboard.putClipboard(match[2]);
        }
        await background_utilities.do_user_command(command_text);
    } else {
        console.error(`Unexpected keyboard shortcut name received by CBV: ${command}`);
    }
});



//
// Performing actions on behalf of the content script
//

// returns the response to send back
async function handle_content_script_message(request, sender) {
    const tab_id   = sender.tab.id;
    const frame_id = sender.frameId;

    if (request.action !== "CBV_HELLO") {
        if (!await background_utilities.epoch_is_current(tab_id, request.epoch)) {
            return { rejected: true };
        }
    }

    switch (request.action) {

    case "CBV_HELLO":
        {
            if (frame_id === 0) {
                const config = await option_storage.get_per_session_options();
                await background_utilities.do_user_command(config.startingCommand, tab_id);
                // The above will send CBV_NEW_EPOCH to all frames.
                return { status: "welcome" };
            } else {
                await background_utilities.notify_new_epoch(tab_id, frame_id);
                return { status: "welcome iframe" };
            }
        }

    case "request_hint_batch":
        {
            const block = await background_utilities.allocate_hint_batch(
                tab_id,
                frame_id,
                request.needed_hint_numbers,
                request.epoch
            );
            if (block === null) {
                return { rejected: true };
            }
            return { rejected: false, first: block.first, last: block.last };
        }


        /*
         * Opening URLs in a new tab/window
         */
    case "create_tab":
        await chrome.tabs.create({
            url: request.URL,
            active: request.active,
            // open new tab immediately to right of current one:
            index: sender.tab.index + 1
        });
        return { status: "tab created" };
    case "create_window":
        await chrome.windows.create({ url: request.URL });
        return { status: "window created" };

        /*
         * Copying text to the clipboard
         */
    case "copy_to_clipboard":
        await clipboard.putClipboard(request.text);
        return { status: "text copied" };

    default:
        console.error("Unknown content script action: " + request.action);
        return { error: "unknown action" };
    }
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // In order to keep the connection open long enough for the
    // response to be received, we need to return true from the callback.
    // (Otherwise, the service worker may go away before the
    // content script is able to read the response.  :-( )  This cannot
    // be done using an async callback, so we need to do a bit of
    // kludging.  For simplicity, we just always send a response.

    // Start work in the background, including always sending a response at the end:
    (async () => {
        try {
            const response = await handle_content_script_message(request, sender);
            console.log("CBV: Handled content script message from", sender,
                        request, "-->", response);
            sendResponse(response);
        } catch (error) {
            console.error(`Error while handling content script message ${request}: ${error}`);
            sendResponse({ error: error.message });
        }
    })();

    // Return true to indicate that the response is being sent asynchronously
    return true;
});
