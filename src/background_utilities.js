//
// Handling commands by sending the command to the content script of the current active tab.
// Assumes we are either the service worker or the pop-up window's JavaScript.
//

import * as option_storage from './option_storage.js';

async function do_show_hints(tab_id, show_hints_parameters, once) {
    let config = await option_storage.get_per_session_options();
    if (!once) {
        config.startingCommand = ":=" + show_hints_parameters;
        await option_storage.put_per_session_options(config);
    }

    // tab_id of -1 means use current tab:
    if (tab_id < 0) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        tab_id = tabs[0].id;
    }

    send_message_to_frame(tab_id, "CBV_NEW_EPOCH",
                          {config: config,
                           show_hint_parameters: show_hints_parameters});    
}

async function do_activate_hint(tab_id, hint_descriptor, operation) {
    // tab_id of -1 means use current tab:
    if (tab_id < 0) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        tab_id = tabs[0].id;
    }

    send_message_to_frame(tab_id, "CBV_PERFORM",
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


export function send_message_to_frame(tab_id, message_type, data) {
    let message = {type: message_type, data: data};
    chrome.tabs.sendMessage(tab_id, message);
}
