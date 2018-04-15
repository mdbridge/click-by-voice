///
/// Main routine
///

function perform_operation(operation, hint_number) {
    if (operation.startsWith("+")) {
	act("set_initial_operation", {initial_operation: operation});
	Hints.remove_hints();
	Hints.add_hints(operation.substr(1));
    } else if (operation == "-") {
	act("set_initial_operation", {initial_operation: operation});
	Hints.remove_hints();
    } else {
	Activate.goto_hint(hint_number, operation);
	setTimeout(Hints.refresh_hints, 750);
    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
	perform_operation(request.operation, request.hint_number);
    });


$(document).ready(function() {
    request("get_initial_operation", {}, function(response) {
	perform_operation(response.initial_operation, "");
    });


    //setTimeout(function() { add_hints(); }, 5000);
    // This runs even when our tab is in the background:
    setInterval(Hints.refresh_hints, 3000);
});
