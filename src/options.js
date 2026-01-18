///
/// JavaScript to implement options.html page, which is the pop-up for setting extension options.
///

import * as option_storage from './option_storage.js';


// Restores shown options using the preferences stored in chrome.storage.sync.
async function restore_options() {
    const saved_options = await option_storage.get_saved_options();
    document.getElementById('command').value = saved_options.startingCommand;
    document.getElementById('config').value  = saved_options.config;
}

// Saves options to chrome.storage.sync.
async function save_options() {
    const command = document.getElementById('command').value;
    const config  = document.getElementById('config').value;
    await option_storage.put_saved_options({
        startingCommand: command,
        config:          config,
    });

    // Change only per-session config, not per-session starting command:
    const current_starting_command = (await option_storage.get_per_session_options()).startingCommand;
    await option_storage.put_per_session_options({
        startingCommand: current_starting_command,
        config:          config,
    });

    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.textContent = 'Click-by-Voice options successfully saved.';
    setTimeout(function() {
        status.textContent = '';
    }, 750);
}


document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
