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
    target_selector = undefined;
    value = value.replace(/\$\{([^\}]*)\}/, function (x,argument){
	target_selector = argument;
	return "";
    });
    hinting_parameters = value;
}

function option(option_name) {
    return (hinting_parameters.indexOf(option_name) != -1);
}



//
// Inspecting (safely) CSS properties
//

// omitting default_value gives a default of undefined
function css(element, property_name, default_value) {
    try {
	return element.css(property_name);
    } catch (e) {
	// the jQuery method .css throws an exception on XML elements
	return default_value;
    }
}




//
// <<<>>>
//

function CBV_inserted_element(element) {
    return element.attr("CBV_hint_element") == "true";
}
