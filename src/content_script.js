///
/// Main routine
///

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
	var operation = request.operation;
	if (operation.startsWith("+")) {
	    remove_hints();
	    hinting_parameters = operation.substr(1);
	    add_hints();
	} else if (operation == "-") {
	    remove_hints();
	} else {
	    goto_hint(request.hint_number, operation);
	}
    });

$(document).ready(function() {
    add_hints();
    //setTimeout(function() { add_hints(); }, 5000);
    // This runs even when our tab is in the background:
    setInterval(refresh_hints, 3000);
});
