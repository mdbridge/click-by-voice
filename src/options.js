import * as defaults from './defaults.js';


// Saves options to chrome.storage.sync.
function save_options() {
    var command = document.getElementById('command').value;
    var config  = document.getElementById('config').value;
    chrome.storage.sync.set({
	startingCommand: command,
	config:          config,
    }, function() {
	chrome.runtime.sendMessage({action: "set_config",
				    config: config});
	// Update status to let user know options were saved.
	var status = document.getElementById('status');
	status.textContent = 'Options saved.';
	setTimeout(function() {
	    status.textContent = '';
	}, 750);
    });
}

// Restores command using the preferences stored in chrome.storage.
function restore_options() {
    chrome.storage.sync.get({
	startingCommand: defaults.initial_operation_default,
	config:          defaults.config_default
    }, function(items) {
	document.getElementById('command').value = items.startingCommand;
	document.getElementById('config').value	 = items.config;
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
