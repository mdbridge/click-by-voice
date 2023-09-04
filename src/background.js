import * as clipboard	 from './background_clipboard.js';
import * as defaults	 from './defaults.js';
import { doUserCommand } from './background-utilities.js';


//
// Shortcut keyboard commands except for _execute_action
//

chrome.commands.onCommand.addListener(async function(command) {
    console.log('Keyboard shortcut name:', command);

    if (command == "blur") {
	console.log('Bluring...');
	doUserCommand(":blur", false);

    } else if (command == "execute_command_from_clipboard") {
	var input	 = await clipboard.getClipboard();
	var command_text = input;
	var match	 = input.match(/^(.*?)!!!([\s\S]*)/m);
	if (match) {
	    command_text = match[1];
	    input        = match[2];
	    await clipboard.putClipboard(input);
	}
	console.log('Cmd: "' + command_text + '"');
	doUserCommand(command_text, false);
    };
});



//
// Performing actions on behalf of the content script
//

var initial_operation;
var config;

chrome.storage.sync.get({
    startingCommand: defaults.initial_operation_default,
    config:          defaults.config_default
}, function(items) {
    // kludge: strip off (hopefully) leading colon:
    initial_operation = items.startingCommand.substring(1);
    config	      = items.config;
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
	console.log(request);
	switch (request.action) {

	    /*
	     * Initial operation, config
	     */
	case "set_config":
	    config = request.config;
	    break;
	case "set_initial_operation":
	    initial_operation =  request.initial_operation;
	    console.log("initial_operation: " + initial_operation);
	    break;
	case "get_initial_operation":
	    sendResponse({initial_operation: initial_operation,
			  config: config});
	    break;


	    /*
	     * Opening URLs in a new tab/window
	     */
	case "create_tab":
	    chrome.tabs.create({url: request.URL, active: request.active,
				// open new tab immediately to right of current one:
				index: sender.tab.index+1});
	    break;
	case "create_window":
	    chrome.windows.create({url: request.URL});
	    break;


	    /*
	     * Copying text to the clipboard
	     */
	case "copy_to_clipboard":
	    clipboard.putClipboard(request.text);
	    break;


	default:
	    console.log("unknown action: " + request.action);
	}
  });
