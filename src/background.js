//
// Shortcut keyboard commands except for browser action
//

chrome.commands.onCommand.addListener(function(command) {
    console.log('Keyboard shortcut name:', command);

    if (command == "blur") {
	console.log('Bluring...');
	// this doesn't work on chrome://... pages due to permission limitations:
	chrome.tabs.executeScript({
	    code: 'document.activeElement.blur()'
	});

    } else if (command == "execute_command_from_clipboard") {
	var clipboard	 = getClipboard();
	var command_text = clipboard;
	var match	 = clipboard.match(/^(.*?)!!!([\s\S]*)/m);
	if (match) {
	    command_text = match[1];
	    clipboard    = match[2];
	    copyTextToClipboard(clipboard);
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
    startingCommand: initial_operation_default,
    config:          config_default
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
	    copyTextToClipboard(request.text);
	    break;


	default:
	    console.log("unknown action: " + request.action);
	}
  });
