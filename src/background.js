//
// Main file for extension service worker.
//
// Note that console messages from the service worker show up in the
// console for the service worker, not the webpage.
//

import * as clipboard      from './background_clipboard.js';
import { do_user_command } from './background_utilities.js';
import * as option_storage from './option_storage.js';


//
// Shortcut keyboard commands except for _execute_action
//

chrome.commands.onCommand.addListener(async function(command) {
    if (command == "blur") {
        console.log('CBV: Blurring...');
        do_user_command(":blur", false);

    } else if (command == "execute_command_from_clipboard") {
        const input        = await clipboard.getClipboard();
        let   command_text = input;
        // allow !!!<new_clipboard> at end so clipboard can be preserved:
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

// returns the response to send back
async function handle_content_script_message(request, sender) {
    switch (request.action) {

        /*
         * Accessing extension option storage
         */
    case "get_per_session_options":
        return option_storage.get_per_session_options();
    case "set_initial_operation":
        let setOptions = await option_storage.get_per_session_options();
        setOptions.startingCommand = request.initial_operation;
        await option_storage.put_per_session_options(setOptions);
        console.log(`Initial_operation is now: ${request.initial_operation}`);
        return { status: "success" };

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
            // console.log("Handled content script message:", request, "-->", response);
            sendResponse(response);
        } catch (error) {
            console.error(`Error while handling content script message ${request}: ${error}`);
            sendResponse({ error: error.message });
        }
    })();

    // Return true to indicate that the response is being sent asynchronously
    return true;
});
