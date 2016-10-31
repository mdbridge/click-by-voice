///
/// Activating a hint by number
///


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

function dispatch_mouse_events(element, event_names) {
    event_names.forEach(function(event_name) {
	var event = document.createEvent('MouseEvents');
	event.initMouseEvent(event_name, true, true, window, 1, 0, 0, 0, 0, 
			     false, false, false, false, 0, null);
	element[0].dispatchEvent(event);
    });
}

function area(element) {
    try {
	return element.height() * element.width();
    } catch (e) {
	return -1;
    }
}

function href(element) {
    return element[0].href;
}


var last_hover = null;

function silently_activate(element, operation) {
    switch (operation) {
	// Hovering:
    case "h":
	if (last_hover) {
	    dispatch_mouse_events(last_hover, ['mouseout', 'mouseleave']);	    
	}
	// hover same element means unhover
	if (last_hover==null || last_hover[0] !== element[0]) {
	    dispatch_mouse_events(element, ['mouseover', 'mouseenter']);	    
	    last_hover = element;
	} else
	    last_hover = null;
	break;

	// Focusing:
    case "f":
	// this also works for iframes
	element[0].focus();
	break;

	// Clicking:
    case "c":
	// dispatch_mouse_events(element, ['mouseover', 'mousedown']);
	// element[0].focus();
	// dispatch_mouse_events(element, ['mouseup', 'click']);
	// dispatch_mouse_events(element, ['mouseover', 'mousedown']);
	// element[0].focus();
	// dispatch_mouse_events(element, ['mouseup', 'click', 'mouseout']);
	dispatch_mouse_events(element, ['mousedown']);
	element[0].focus();
	dispatch_mouse_events(element, ['mouseup', 'click']);
	break;

	// Following or copying explicit links:
    case "t":
	if (element.attr("href"))
	    act("create_tab", {URL: href(element), active: true});
	break;
    case "b":
	if (element.attr("href"))
	    act("create_tab", {URL: href(element), active: false});
	break;
    case "w":
	if (element.attr("href"))
	    act("create_window", {URL: href(element)});
	break;
    case "k":
	act("copy_to_clipboard", {text: href(element)});
	break;


	// old versions for comparison purposes; depreciated
    case "C":
	element[0].click();
	break;
    case "CC":
	dispatch_mouse_events(element, ['mouseover', 'mousedown', 'mouseup', 
					'click']);
	break;
    case "DC":
	if (element.children().length>0)
	    element = element.children().first();
	element[0].click();
	break;

    case "TT":
	element.attr("tabindex", "0");
	element.siblings().attr("tabindex", "-1");
	break;


    case "F":
	element[0].focus();
	break;
    case "FF":
	element[0].focusin();
	element[0].focus();
	break;
    case "FFF":
	element[0].contentWindow.focus();
	break;

    case "D":
	console.log(element[0]);
	break;

	// experimental:
    case "R":
	dispatch_mouse_events(element, ['mouseover', 'contextmenu']);
	break;

    case ">":
	dispatch_mouse_events(element, ['mouseover', 'mousedown', 'mouseout']);
	break;
    case "<":
	dispatch_mouse_events(element, ['mouseover', 'mouseup', 'click', 'mouseout']);
	break;



    default:
	console.log("unknown activate operation: " + operation);
    }
}

function activate(element, operation) {
    if (operation=="c" && element.is("div, span")) {
	var parent = element;
	var max_area = 0;
	parent.children().each(function(index) {
	    if (!disabled_or_hidden($(this)) &&
	       area($(this))>max_area) {
		max_area = area($(this));
		element = $(this);
	    }
	});
	console.log(parent[0] + " -> " + element[0]);
    }


    element.addClass("CBV_highlight_class");

    setTimeout(function() {
	setTimeout(function() {
	    // sometimes elements get cloned so do this globally...
	    $(".CBV_highlight_class").removeClass("CBV_highlight_class");
	}, 500);

	silently_activate(element, operation);
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
