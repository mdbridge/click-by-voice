//
// Labeling elements with hint tags
//

var next_CBV_hint = 0;

// Enumerate each element that we should hint, possibly more than once:
function each_hintable(callback) {
    $("input").each(function(index) {
	var input_type = $(this).attr("type");
	if (input_type)
	    input_type = input_type.toLowerCase();
	var usable = true;
	if (input_type == "hidden") 
	    usable = false;
	if ($(this).attr("disabled"))
	    usable = false;
	if ($(this).attr("readonly"))
	    usable = false;

	if (usable)
	    callback($(this));
    });

    $("button").each(function(index) {
	callback($(this));
    });

    $("select").each(function(index) {
	callback($(this));
    });

    $("keygen").each(function(index) {
	callback($(this));
    });

    $("a[href]").each(function(index) {
	callback($(this));
    });

    $("[onclick]").each(function(index) {
	callback($(this));
    });
}


function add_hints() {
    //console.log("adding hints");

    each_hintable(function(element) {
	if (!element.is("[CBV_hint_number]")) {
	    element.attr("CBV_hint_number", next_CBV_hint);
	    element.after("<span CBV_hint_tag='" + next_CBV_hint + "'></span>");
	    next_CBV_hint = next_CBV_hint + 1;
	}
    });

    //console.log("total hints assigned: " + next_CBV_hint);
}



//
// Activating a hint by number
//

function goto_hint(hint) {
    console.log("goto_hint: " + hint);
    var click_it = true;
    if (hint.substring(hint.length-1) == "f") {
	click_it = false;
	hint = hint.substring(0, hint.length - 1);
    }
    console.log("goto_hint: " + hint + "by: " + click_it);

    var element = $("[CBV_hint_number='" + hint + "']");
    if (element.length != 0) {
	element.addClass("CBV_highlight_class");
	setTimeout(function() {
	    if (click_it)
		element[0].click();
	    else
		element[0].focus();

	    setTimeout(function() {
		element.removeClass("CBV_highlight_class");
	    }, 500);
	}, 250);
    }
}



//
// Main routine
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
