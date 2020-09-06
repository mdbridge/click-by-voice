///
/// Code for figuring out which elements of the webpage should be hinted
///
/// Provides FindHint

var FindHint = null;

(function() {


    // does element occupy enough space to be easily clickable?
    function clickable_space(element) {
	try {
	    // Jquery gives errors for these if they are auto due to
	    // no CSS (e.g., XML files):
	    if (element.outerHeight(true)<8 
		|| element.outerWidth(true)<8)
		return false;
	} catch (e) {}
	return true;
    }


    function fast_hintable(element) {
	if (Hints.option('$'))
	    return element.is(Hints.option_value('$'));

	//
	// Standard clickable or focusable HTML elements
	//
	//   Quora has placeholder links with click handlers so allow a's
	//   w/o hrefs...
	//
	var element_tag = element[0].nodeName.toLowerCase();
	switch (element_tag) {
	    case "a":
	    case "button":
	    case "select":
	    case "textarea":
	    case "keygen":
	    case "iframe":
	    return true;

	    case "input":
	    var input_type = element.attr("type");
	    if (input_type)
		input_type = input_type.toLowerCase();
	    if (input_type != "hidden" 
		// not sure false is actually kosher; spec says otherwise <<<>>>
		&& (element.attr("disabled")=="false" || element.attr("disabled")===undefined))
		return true;
	    break;
	}


	//
	// HTML elements directly made clickable or focusable
	//
	if (element[0].hasAttribute("onclick")) 
	    return true;
	if (element[0].hasAttribute("tabindex") && element.attr("tabindex") >= 0)
	    return true;


	//
	// HTML elements that might be clickable due to event listeners or
	// focusable via tabindex=-1
	//
	if (!Hints.option("A")) {
	    var role = element.attr("role");
	    switch (role) {
	    case "button":
	    case "checkbox":
	    case "link":
	    case "menuitem":
	    case "menuitemcheckbox":
	    case "menuitemradio":
	    case "option":
	    case "radio":
	    case "slider":
	    case "tab":
	    case "textbox":
	    case "treeitem":
		return true;
	    }
	}


	// code for finding clickable elements due to cursor: pointer in
	// post-order traversal of each_hintable


	// hard coding XML file buttons: <<<>>>
	if (/\.xml/i.test(window.location.href)) {
	    if (element.is("span.folder-button.open, span.folder-button.fold"))
		return true;
	}


	if (Hints.option_value("+",0)<2)
	    return false;

	//
	// Anything we think likely to be clickable or focusable
	//

	// this is *everything* focusable:
	if (element[0].hasAttribute("tabindex")) 
	    return true;

	if (element_tag == "li") 
	    return true;

	// innermost div/span/img's are tempting click targets
	switch (element_tag) {
	case "div": case "span": case "img":
	    if (clickable_space(element) && element.children().length == 0)
		return true;
	}

	return false;

    }

    function hintable(element) {
	// for timing how much hintable costs:
	if (Hints.option("N"))
	    return false;

	if (fast_hintable(element)) {
	    // don't hint invisible elements (their children may be another matter)
	    if (css(element, "visibility") == "hidden" && Hints.option_value("+",0)<2) 
		return false;

	    if (Hints.option('^') && element.is(Hints.option_value('^')))
		return false;
	    return true;
	} else {
	    if (Hints.option('|') && element.is(Hints.option_value('|'))) {
		// don't hint invisible elements (their children may be another matter)
		if (css(element, "visibility") == "hidden" && Hints.option_value("+",0)<2) 
		    return false;
		return true;
	    }
	    return false;
	}
    }

    // Enumerate each element that we should hint:
    function each_hintable(callback) {
	DomWalk.each_displaying(
	    // pre-order traversal:
	    function (element) {
		if (hintable(element))
		    callback(element);

		// post-order traversal:
	    }, function (element) {
		if (Hints.option('$') && !Hints.option("C"))
		    return;
		if (element.attr("CBV_hint_number"))
		    return;

		if (css(element, "cursor") != "pointer")
		    return;  // XML webpages return here
		if (element.css("visibility") == "hidden") 
		    return;  // visibility blocks cursor: pointer
		if (element.parent().css("cursor")=="pointer")
		    return;

		if (!clickable_space(element))
		    return;

		if (element.parent().attr("CBV_hint_number"))
		    return;

		if (element.has("[CBV_hint_number]").length != 0)
		    return;

		if (Hints.option('^') && element.is(Hints.option_value('^')))
		    return false;

		if (Hints.option("C"))
		    Hints.with_high_contrast(
			function () { callback(element); });
		else
		    callback(element);
	    },
	    Hints.option_value('!') // exclusion
	);
    }


    FindHint = {each_hintable: each_hintable};
})();
