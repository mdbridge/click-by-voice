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
