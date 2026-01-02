//
// Handling commands by sending the command to the content script of the current active tab.
// Assumes we are either the service worker or the pop-up window's JavaScript.
//

import * as option_storage from './option_storage.js';

async function do_show_hints(tab_id, show_hints_parameters, once) {
    if (!once) {
        let config = await option_storage.get_per_session_options();
        config.startingCommand = ":=" + show_hints_parameters;
        await option_storage.put_per_session_options(config);
    }

    // tab_id of -1 means use current tab:
    if (tab_id < 0) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        tab_id = tabs[0].id;
    }

    await notify_all_of_new_epoch(tab_id, show_hints_parameters);
}

async function do_activate_hint(tab_id, hint_descriptor, operation) {
    // tab_id of -1 means use current tab:
    if (tab_id < 0) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        tab_id = tabs[0].id;
    }

    send_message_to_frame(tab_id, 0, "CBV_PERFORM",
                          {hint_descriptor: hint_descriptor,
                           operation:       operation});    
}

export async function do_user_command(command_text, tab_id = -1) {
    // optional operation field is :<suffix> at end
    let hint_descriptor = command_text;
    let operation       = "";
    // Allow :'s inside 1 level of balanced {}'s to not count as the before operation separator:
    const match = command_text.match(/^((?:[^:\{]|\{[^\}]*\})*):(.*)$/);
    if (match) {
        hint_descriptor = match[1];
        operation       = match[2];
    }

    // handle legacy show hints commands, rewriting them to use =:
    if (/^(\+|-)/.test(operation)) {
        operation = '=' + operation;
    }
    if (/^once(\+|-)/.test(operation)) {
        operation = 'once=' + operation.substr(4);
    }

    if (operation.startsWith("=")) {
        await do_show_hints(tab_id, operation.substr(1), false);
    } else if (operation.startsWith("once=")) {
        await do_show_hints(tab_id, operation.substr(5), true);
    } else {
        await do_activate_hint(tab_id, hint_descriptor, operation);
    }
}


export function send_message_to_frame(tab_id, frame_id, message_type, data) {
    let message = {type: message_type, data: data, frame_id: frame_id};
    chrome.tabs.sendMessage(tab_id, message, { frameId: frame_id }, 
                            () => {
                                // We are best effort so ignore errors
                                // -- frame may no longer exist by
                                // this point, for example.
                                //
                                // MUST read lastError to suppress console noise.
                                void chrome.runtime.lastError;
                            });
}


let last_show_hints_parameters = "";  // <<<>>>

export async function notify_all_of_new_epoch(tab_id, show_hints_parameters) {
    last_show_hints_parameters = show_hints_parameters; // <<<>>>

    const config = await option_storage.get_per_session_options();
    const data   = {config: config, show_hint_parameters: show_hints_parameters};

    const frames = await chrome.webNavigation.getAllFrames({ tabId: tab_id });
    frames.forEach(({ frameId }) => {
        send_message_to_frame(tab_id, frameId, "CBV_NEW_EPOCH", data);
    });
}

export async function notify_new_epoch(tab_id, frame_id) {
    const show_hints_parameters = last_show_hints_parameters; // <<<>>>

    const config = await option_storage.get_per_session_options();
    const data   = {config: config, show_hint_parameters: show_hints_parameters};

    send_message_to_frame(tab_id, frame_id, "CBV_NEW_EPOCH", data);
}
