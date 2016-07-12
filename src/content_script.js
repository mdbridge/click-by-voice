//
// Requesting background script to perform actions on our behalf
//

function act(action, arguments) {
    arguments.action = action;
    chrome.runtime.sendMessage(arguments);
}



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

    $("[tabindex]").each(function(index) {
	//if ($(this).attr("tabindex"))
	callback($(this));
    });

    $("[role]").each(function(index) {
	var usable = true;
	if ($(this).css("display") == "none")
	    usable = false;
	var role = $(this).attr("role");
	switch (role) {
	    case "button":
	    case "link":
	    if (usable)
		callback($(this));
	    break;
	}
    });
}


function add_hints() {
    //console.log("adding hints");

    each_hintable(function(element) {
	if (!element.is("[CBV_hint_number]")) {
	    element.attr("CBV_hint_number", next_CBV_hint);
//	    element.after("<span CBV_hint_tag='" + next_CBV_hint + "'></span>");
	    if (element.is("a"))
		element.append("<span CBV_hint_tag='" + next_CBV_hint + "'></span>");
	    else
		element.after("<span CBV_hint_tag='" + next_CBV_hint + "'></span>");
	    next_CBV_hint = next_CBV_hint + 1;
	}
    });

    //console.log("total hints assigned: " + next_CBV_hint);
}



//
// Activating a hint by number
//

// apply heuristics to determine if an element should be clicked or
// focused
function wants_click(element) {
    if (element.is("button")) {
	return true;
    } else if (element.is("a")) {
	return true;
    } else if (element.is(":input")) {
	if (element.attr("type") == "submit")
	    return true;
	if (element.attr("type") == "checkbox")
	    return true;
	if (element.attr("type") == "radio")
	    return true;
	if (element.attr("type") == "button")
	    return true;
    }
    if (element.attr("onclick")) {
	return true;
    }
    var role = element.attr("role");
    switch (role) {
    case "button":
    case "link":
	return true;
	break;
    }

    return false;
}

function activate(element, operation) {
    element.addClass("CBV_highlight_class");
    setTimeout(function() {
	switch (operation) {
	case "c":
	    element[0].click();
	    break;
	case "f":
	    element[0].focus();
	    break;

	case "t":
	    if (element.attr("href"))
		act("create_tab", {URL: element[0].href, active: true});
	    break;
	case "b":
	    if (element.attr("href"))
		act("create_tab", {URL: element[0].href, active: false});
	    break;
	case "w":
	    if (element.attr("href"))
		act("create_window", {URL: element[0].href});
	    break;

	default:
	    console.log("unknown activate operation: " + operation);
	}

	setTimeout(function() {
	    element.removeClass("CBV_highlight_class");
	}, 500);
    }, 250);
}

function goto_hint(hint, operation) {
    var element = $("[CBV_hint_number='" + hint + "']");
    if (element.length == 0) {
	console.log("goto_hint: unable to find hint: " + hint);
	return;
    }

    if (operation == "") {
	if (wants_click(element))
	    operation = "c";
	else
	    operation = "f";
	//console.log("defaulting to: " + operation);
    }

    activate(element, operation);
}



//
// Main routine
//

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
	goto_hint(request.hint_number, request.operation);
    });

$(document).ready(function() {
    add_hints();
    //setTimeout(function() { add_hints(); }, 5000);
    // This runs even when our tab is in the background:
    setInterval(add_hints, 3000);
});
