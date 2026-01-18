//
// Handling commands by sending the command to the content script of the current active tab.
// Assumes we are either the service worker or the pop-up window's JavaScript.
//

import * as option_storage from './option_storage.js';


// Promise chain to serialize operations that modify tab state
let tab_state_queue = Promise.resolve();

async function perform_tab_operation(operation) {
    const result_promise = tab_state_queue.then(operation);
    // Update queue, ignore errors for chaining purposes
    tab_state_queue = result_promise.catch(() => {});
    return await result_promise;
}


async function generate_next_epoch() {
    const result = await chrome.storage.session.get('next_global_epoch');
    const next_epoch = (result.next_global_epoch || 0);
    await chrome.storage.session.set({ next_global_epoch: next_epoch + 1 });
    return next_epoch;
}

async function get_tab_info(tab_id) {
    const key = `tab_${tab_id}`;
    const result = await chrome.storage.session.get(key);
    return result[key] || null;
}

async function initialize_tab_info(tab_id, show_hints_parameters) {
    return await perform_tab_operation(async () => {
        const key = `tab_${tab_id}`;
        const epoch = await generate_next_epoch();
        await chrome.storage.session.set({
            [key]: {
                epoch: epoch,
                show_hints_parameters: show_hints_parameters,
                next_hint_number: 0
            }
        });
        console.log(`CBV: initialized tab ${tab_id}, epoch ${epoch},` +
                    ` params: "${show_hints_parameters}"`); // <<<>>>
        return epoch;
    });
}

export async function allocate_hint_batch(tab_id, frame_id, needed_hint_numbers, epoch) {
    return await perform_tab_operation(async () => {
        const tab_info = await get_tab_info(tab_id);

        // Check for stale epoch first
        if (!tab_info || epoch !== tab_info.epoch) {
            return null;
        }

        if (needed_hint_numbers === 0) {
            return { first: 0, last: -1 };  // Empty block
        }

        const first = tab_info.next_hint_number;
        const last = first + needed_hint_numbers - 1;

        tab_info.next_hint_number = last + 1;

        const key = `tab_${tab_id}`;
        await chrome.storage.session.set({ [key]: tab_info });

        console.log(`CBV: Allocated hints ${first}-${last} to frame ${frame_id}`);

        return { first: first, last: last };
    });
}


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

    await initialize_tab_info(tab_id, show_hints_parameters);
    await notify_new_epoch(tab_id);
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


export async function notify_new_epoch(tab_id, frame_id = -1) {
    const tab_info = await get_tab_info(tab_id);
    if (!tab_info) {
        // A non-top frame may have caused us to reach here before the
        // top frame has done show hints; do nothing -- when the top
        // frame does show hints we will get notified at that time
        // with the actual data.
        return;
    }

    const config = await option_storage.get_per_session_options();
    const data = {
        epoch:                tab_info.epoch,
        config:               config,
        show_hint_parameters: tab_info.show_hints_parameters
    };

    if (frame_id === -1) {
        const frames = await chrome.webNavigation.getAllFrames({ tabId: tab_id });
        frames.forEach(({ frameId }) => {
            send_message_to_frame(tab_id, frameId, "CBV_NEW_EPOCH", data);
        });
    } else {
        send_message_to_frame(tab_id, frame_id, "CBV_NEW_EPOCH", data);
    }
}
