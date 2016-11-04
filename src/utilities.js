//
// Requesting background script to perform actions on our behalf
//

function act(action, arguments) {
    arguments.action = action;
    chrome.runtime.sendMessage(arguments);
}

function request(action, arguments, callback) {
    arguments.action = action;
    chrome.runtime.sendMessage(arguments, callback);
}



//
// Testing for parameters to last show hints command
//

var hinting_parameters = ""; // extra argument to :+ if any
var target_selector    = undefined;

function set_hinting_parameters(value) {
    var i = value.indexOf("$");
    if (i != -1) {
	hinting_parameters = value.slice(0,i);
	target_selector    = value.slice(i+1);
    } else {
	hinting_parameters = value;
	target_selector    = undefined;
    }
}

function option(option_name) {
    return (hinting_parameters.indexOf(option_name) != -1);
}
