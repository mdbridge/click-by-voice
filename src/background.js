//
// Shortcut keyboard commands except for browser action
//

chrome.commands.onCommand.addListener(function(command) {
    console.log('Command:', command);

    if (command == "blur") {
	console.log('Bluring...');
	// this doesn't work on chrome://... pages due to permission limitations:
	chrome.tabs.executeScript({
	    code: 'document.activeElement.blur()'
	});
    }
});



//
// Performing actions on behalf of the content script
//

var initial_operation = "+";

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
	console.log(request);
	switch (request.action) {

	    /*
	     * Initial operation 
	     */
	case "set_initial_operation":
	    initial_operation =  request.initial_operation;
	    console.log("initial_operation: " + initial_operation);
	    break;
	case "get_initial_operation":
	    sendResponse({initial_operation: initial_operation});
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


	default:
	    console.log("unknown action: " + request.action);
	}
  });
