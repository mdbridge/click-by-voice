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

function option(option_name) {
    return (hinting_parameters.indexOf(option_name) != -1);
}
