///
/// Main routine
///

function perform_operation(operation, hint_number) {
    if (operation.startsWith("+")) {
	act("set_initial_operation", {initial_operation: operation});
	remove_hints();
	hinting_parameters = operation.substr(1);
	add_hints();
    } else if (operation == "-") {
	act("set_initial_operation", {initial_operation: operation});
	remove_hints();
    } else {
	goto_hint(hint_number, operation);
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
    setInterval(refresh_hints, 3000);
});
