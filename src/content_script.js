///
/// Main routine
///

var next_major_refresh = 0;
function major_happened() {
    const major_delay = parseInt(Hints.option_value("refresh", 3000));
    next_major_refresh = new Date().getTime() + major_delay;
}

// This runs even when our tab is in the background:
function maybe_refresh() {
    const now = new Date().getTime();
    if (now > next_major_refresh) {
	Hints.refresh_hints();
	major_happened();
    }
}


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
	major_happened();
    } else if (operation.startsWith("once=")) {
	Hints.remove_hints();
	Hints.add_hints(operation.substr(5));
	major_happened();
    } else {
	Activate.goto_hint(hint_number, operation);
	next_major_refresh = new Date().getTime() + 
	    parseInt(Hints.option_value("refresh_after_activate", 500));
    }
}

if (window == window.top) {
    // the following only runs outside of any [i]frames

    chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
	    perform_operation(request.operation, request.hint_number);
	});

    $(document).ready(function() {
	request("get_initial_operation", {}, function(response) {
	    Hints.set_config(response.config);
	    perform_operation(response.initial_operation, "");
	});

	// try and let initial operation above do 1st hint placement,
	// but fall back on defaults if no response in five seconds:
	next_major_refresh = new Date().getTime() + 5000;	
	setInterval(maybe_refresh, 100);
    });

}
