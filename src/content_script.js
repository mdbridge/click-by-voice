///
/// Main routine
///

function perform_operation(operation, hint_number) {
    if (operation == "blur") {
	document.activeElement.blur();
	return;
    }

    // handle legacy show hints commands, rewriting them to use =:
    if (/^(\+|-)/.test(operation)) {
	operation = '=' + operation;
    }
    if (/^once(\+|-)/.test(operation)) {
	operation = 'once=' + operation.substr(4);
    }

    if (operation.startsWith("=")) {
	act("set_initial_operation", {initial_operation: operation});
	Hints.remove_hints();
	Hints.add_hints(operation.substr(1));
    } else if (operation.startsWith("once=")) {
	Hints.remove_hints();
	Hints.add_hints(operation.substr(5));
    } else {
	Activate.goto_hint(hint_number, operation);
	setTimeout(Hints.refresh_hints, 750);
    }
}

if (window == window.top) {
    // the following only runs outside of any iframes

    chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
	    perform_operation(request.operation, request.hint_number);
	});


    $(document).ready(function() {
	request("get_initial_operation", {}, function(response) {
	    Hints.set_config(response.config);
	    perform_operation(response.initial_operation, "");
	});


	//setTimeout(function() { add_hints(); }, 5000);
	// This runs even when our tab is in the background:
	setInterval(Hints.refresh_hints, 3000);
    });

}
