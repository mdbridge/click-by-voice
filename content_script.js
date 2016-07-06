//
// Labeling elements with hint tags
//

var next_CBV_hint = 0;

// Enumerate each element that we should hint, possibly more than once:
function each_hintable(callback) {
    $("a[href]").each(function(index) {
	callback($(this));
    });
}


function add_hints() {
    console.log("adding hints");

    each_hintable(function(element) {
	if (!element.is("[CBV_hint_number]")) {
	    element.attr("CBV_hint_number", next_CBV_hint);
	    element.after("<span CBV_hint_tag='" + next_CBV_hint + "'></span>");
	    next_CBV_hint = next_CBV_hint + 1;
	}
    });

    console.log("total hints assigned: " + next_CBV_hint);
}



//
// 
//

function goto_hint(hint) {
    console.log("goto_hint: " + hint);

    var element = $("[CBV_hint_number='" + hint + "']");
    if (element.length != 0)
	element[0].click();
}



//
// 
//

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
	goto_hint(request.hint_number);
    });

$(document).ready(function() {
    add_hints();
    //setTimeout(function() { add_hints(); }, 5000);
    // This runs even when our tab is in the background:
    setInterval(add_hints, 3000);
});
