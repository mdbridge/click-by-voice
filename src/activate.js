///
/// Activating a hint by number
///
/// Provides Activate

var Activate = null;

(function() {

    //
    // Working with points
    //

    // return position relative to viewpoint to click
    function point_to_click(element) {
	var rectangles = element[0].getClientRects();
	var rectangle  = rectangles[0];

	var x = (rectangle.left + rectangle.right) /2;
	var y = (rectangle.top  + rectangle.bottom)/2;

	return {x: x, y: y};
    }

    // return position relative to viewpoint of top right point of element
    function top_right_point(element) {
	var rectangles = element[0].getClientRects();
	var rectangle  = rectangles[0];

	var x = rectangle.right;
	var y = rectangle.top;

	return {x: x, y: y};
    }

    // Convert viewpoint point to screen coordinates relative to inner
    // top-left corner of browser (aka, just inside window borders)
    // 
    // This is accurate to within +/- 1 after rounding so long as
    // there isn't any UI stuff like a downloads bar at the bottom of the
    // browser.
    function clientToRelativeScreen(clientX, clientY, externalZoom, isMaximized) {
	var zoom = window.devicePixelRatio / externalZoom;
	var borderSize = 8;
	if (isMaximized) {
	    borderSize = 0;
	}			
	// Unfortunately this includes any space at the bottom of the
	// browser like a downloads section.
	var browserHeader = window.outerHeight - borderSize*2 - window.innerHeight*zoom;
	//console.log("browserHeader: "+ browserHeader);

	var screenX = clientX*zoom;
	var screenY = clientY*zoom + browserHeader;
	return {x: screenX, y: screenY};
    }	

    // Convert viewpoint point to screen coordinates relative to window
    // and place in clipboard
    function output_viewport_point(point, externalZoom, isMaximized) {
	var screenPoint = clientToRelativeScreen(point.x, point.y, externalZoom, isMaximized);
	var answer = screenPoint.x + "," + screenPoint.y;

	console.log("********************************************************************************");
	console.log("input client point: " + point.x + " , " + point.y);
	console.log("assumed externalZoom: " + externalZoom);
	var zoom = window.devicePixelRatio / externalZoom;
	console.log("zoom: " + zoom);
	console.log("isMaximized: " + isMaximized);
	console.log("output screen point: " +answer);

	act("copy_to_clipboard", {text: answer});
    }



    //
    // 
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

	if (css(element, "cursor", null) == "pointer")
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
	if (element.is("iframe, frame"))
	    return element[0].src;
	if (element.attr("href"))
	    return element[0].href;
	return undefined;
    }



    var last_hover = null;

    function silently_activate(element, operation) {
	// It is impossible to measure this from inside the browser so
	// we are just assuming it's 1.0, which means that the
	// physical-move-the-mouse commands will only work on monitors
	// with no DPI scaling.
	const externalZoom = 1.0;

	switch (operation) {
	    // Focusing:
	case "f":
	    // this also works for [i]frames
	    element[0].focus();
	    break;

	    // Clicking:
	case "c":
	    // quora.com needs the mouseover event for clicking 'comments':
	    dispatch_mouse_events(element, ['mouseover', 'mousedown']);
	    element[0].focus();
	    // we are not simulating leaving the mouse hovering over the element here <<<>>>
	    dispatch_mouse_events(element, ['mouseup', 'click', 'mouseout']);
	    break;

	    // Following or copying explicit links:
	case "t":
	    if (href(element))
		// change focus to new tab
		act("create_tab", {URL: href(element), active: true});
	    break;
	case "b":
	    if (href(element))
		// do not change focus to new tab
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

	    // Copying element text:
	case "s":
	    var clone = element.clone();
	    clone.find("[CBV_hint_element]").remove();
	    console.log(clone[0]);
	    var text = clone[0].textContent;
	    console.log('"' + text + '"');
	    act("copy_to_clipboard", {text: text});
	    break;



	    // Debug information:
	case "D":
	    console.log("");
	    console.log("Element information:");
	    console.log(element[0].getBoundingClientRect());
	    console.log(element[0]);
	    break;

	    // Moving the physical mouse:
	case "Xm":
	    output_viewport_point(point_to_click(element), externalZoom, true);
	    break;
	case "XXm":
	    output_viewport_point(top_right_point(element), externalZoom, true);
	    break;
	case "Xn":
	    output_viewport_point(point_to_click(element), externalZoom, false);
	    break;
	case "XXn":
	    output_viewport_point(top_right_point(element), externalZoom, false);
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

	case "K":
	    element[0].remove();
	    break;
	case "V":
	    element.css("visibility", "hidden");
	    break;
       case "ZAP":
           element.value = "fill";
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

	case "FF":
	    element[0].focusin();
	    element[0].focus();
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
		element.removeClass("CBV_highlight_class");
		// sometimes elements get cloned so do this globally also...
		// TODO: do we need to make this work inside of [i]frames also? <<<>>>
		$(".CBV_highlight_class").removeClass("CBV_highlight_class");
	    }, 500);

	    silently_activate(element, operation);
	}, 250);
    }

    // Find a hinted element in the page, or in a nested [i]frame
    function find_hint(hint, ...contents) {
	var element;
	var match = hint.match(/^\$\{(.*)\}("(.*)")?$/);
	if (match) {
	    element = $(match[1], ...contents);
	    if (match[3]) {
		target = match[3].toLowerCase();
		element = element.filter(function(index, e) {
		    return e.textContent.toLowerCase().includes(target);
		});
	    }
	    element = element.first();
	} else {
	    element = $("[CBV_hint_number='" + hint + "']", ...contents);
	}

        // if the hint was not found, search recursively in any [i]frames
        if (element.length == 0) {
            var frames = $("iframe, frame", ...contents);
            if (frames.length != 0) {
                return find_hint(hint, frames.contents());
            }
        }

	return element;
    }

    function goto_hint(hint, operation) {
	var element = find_hint(hint);
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


    Activate = {goto_hint: goto_hint};
})();
