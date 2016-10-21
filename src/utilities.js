//
// Requesting background script to perform actions on our behalf
//

function act(action, arguments) {
    arguments.action = action;
    chrome.runtime.sendMessage(arguments);
}



//
// Testing for parameters to last show hints command
//

var hinting_parameters = ""; // extra argument to :+ if any
//hinting_parameters = "vb";

function option(option_name) {
    return (hinting_parameters.indexOf(option_name) != -1);
}
