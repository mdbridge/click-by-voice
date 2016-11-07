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

    if (element.css("cursor") == "pointer")
	return true;

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
    if (element.is("iframe"))
	return element[0].src;
    if (element.attr("href"))
	return element[0].href;
    return undefined;
}

// position relative to viewpoint to click
function point_to_click(element) {
    var rectangles = element[0].getClientRects();
    var rectangle  = rectangles[0];

    var x = (rectangle.left + rectangle.right) /2;
    var y = (rectangle.top  + rectangle.bottom)/2;

    // console.log(">> point_to_click:");
    // console.log(rectangles);
    // console.log(rectangle);
    // console.log(element[0].getBoundingClientRect());
    // console.log(element.offset());
    // console.log(element.offset().top  - window.scrollY);
    // console.log(element.offset().left - window.scrollX);

    return {x: x, y: y};
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
	if (href(element))
	    act("create_tab", {URL: href(element), active: true});
	break;
    case "b":
	if (href(element))
	    act("create_tab", {URL: href(element), active: false});
	break;
    case "w":
	if (href(element))
	    act("create_window", {URL: href(element)});
	break;
    case "k":
	if (href(element))
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
	console.log(element[0].getBoundingClientRect());
	break;

    case "X":
	var target = point_to_click(element);
	console.log(target);

	var zoom = window.devicePixelRatio;
	console.log("zoom: " + zoom);

	// console.log(window.screenX);
	// console.log(window.screenY);
	// x -= window.screenX - 8;
	// y -= window.screenY - 8;

	console.log(window.outerHeight);
	console.log(window.innerHeight);
	var delta = window.outerHeight - window.innerHeight*zoom;
	// I believe this is the height of the browser chrome at the top
	console.log("delta: " + delta);

	var x = target.x*zoom + 0;
	var y = target.y*zoom + delta;

	if (window.outerWidth == window.screen.width) {
	    console.log("maximized");
	    // window actually starts at -8, -8:
	    x += 8;
	    y += 8;
	} else {
	    // still have side border, but not top one
	    x += 8; // maybe should be 7?
	    y -= 8;
	}

	var answer = Math.floor(x) + "," + Math.floor(y);
	console.log(answer);

	act("copy_to_clipboard", {text: answer});
	break;

    case "L":
	console.log(element.offset());
	break;
    case "LL":
	var delta = window.outerHeight - window.innerHeight;
	console.log(delta);
	act("copy_to_clipboard", {text: Math.floor(element.offset().top + delta) 
				  + "," + Math.floor(element.offset().left)});

	console.log(window.screenY);
	console.log(window.screenX);
	console.log(element.offset());
	break;
    case "INSPECT":
	$('body').click(function (event) {
	    var zoom = window.devicePixelRatio;
	     console.log(event.originalEvent);
	     console.log("Y: " + (event.screenY - event.clientY));
	     console.log("X: " + (event.screenX - event.clientX));
	     console.log("WY: " + (event.screenY - window.screenY - event.clientY));
	     console.log("WX: " + (event.screenX - window.screenX - event.clientX));
	     console.log("X ratio: " + ( event.clientX / event.screenX));

	     console.log("measured Delta: " + (event.screenY - window.screenY - event.clientY*zoom));


	});
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
	    if (//!disabled_or_hidden($(this)) &&  // <<<>>>
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
	console.log(element[0]);
	console.log("defaulting to: " + operation);
    }

    activate(element, operation);
}
