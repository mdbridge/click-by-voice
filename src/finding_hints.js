///
/// Code for figuring out which elements of the webpage should be hinted
///

function CBV_inserted_element(element) {
    return element.attr("CBV_hint_element") == "true";
}


function each_displaying_helper(element, pre_callback, post_callback) {
    if (CBV_inserted_element(element))
    	return;

    try {
	// Jquery gives an error error for this if no CSS (e.g., XML files):
	if (element.css("display") == "none")
	    return true;
    } catch (e) {}

    if (pre_callback)
	pre_callback(element);

    element.children().each(function(index) {
	each_displaying_helper($(this), pre_callback, post_callback);
    });

    // // <<<>>>
    // if (element.is("iframe")) {
    // 	try {
    // 	    var sub_body = $('body', element.contents());
    // 	    each_displaying_helper(sub_body, pre_callback, post_callback);
    // 	} catch (e) {
    // 	    console.log("iframe access failure: " + e);
    // 	}
    // }

    if (post_callback)
	post_callback(element);
}

// Enumerate each webpage element that is displayed (that is, has a
// display property other than none *and* all its parents have display
// properties other than none).
//
// pre_callback is the preorder traversal, post_callback the
// post-order traversal
function each_displaying(pre_callback, post_callback) {
    var root = $("body");
    each_displaying_helper(root, pre_callback, post_callback);
}



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


function hintable(element) {
    // for timing how much hintable costs:
    if (option("!"))
	return false;

    //
    // Experiments:
    //
    if (target_selector)
	return element.is(target_selector);


    //
    // Standard clickable or focusable HTML elements
    //
    //   Quora has placeholder links with click handlers so allow a's
    //   w/o hrefs...
    //
    if (element.is("a, button, select, textarea, keygen, iframe"))
	return true;

    if (element.is("input")) {
	var input_type = element.attr("type");
	if (input_type)
	    input_type = input_type.toLowerCase();
	if (input_type != "hidden" 
	    // not sure false is actually kosher; spec says otherwise <<<>>>
	    && (element.attr("disabled")=="false" || element.attr("disabled")===undefined))
	    return true;
    }


    //
    // HTML elements directly made clickable or focusable
    //
    if (element.is("[onclick]")) 
	return true;
    if (element.is("[tabindex]") && element.attr("tabindex") != "-1")
	return true;


    //
    // HTML elements that might be clickable due to event listeners or
    // focusable via tabindex=-1
    //
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


    // hard coding XML file buttons: <<<>>>
    if (/\.xml/.test(window.location.href)) {
	if (element.is("span.button.collapse-button, span.button.expand-button"))
	    return true;
    }


    if (!option("+"))
	return false;

    //
    // Anything we think likely to be clickable or focusable
    //

    // this is *everything* focusable:
    if (element.is("[tabindex]")) 
	return true;

    if (element.is("li")) 
	return true;

    // innermost div/span/img's are tempting click targets
    if (element.is("div, span, img")) {
	if (clickable_space(element) && element.children().length == 0)
	    return true;
    }


    return false;
}


// Enumerate each element that we should hint:
function each_hintable(callback) {
    if (!option("C")) {
	each_displaying(function (element) {
	    if (hintable(element))
		callback(element);
	}, undefined);

    } else {
	each_displaying(function (element) {
	    if (hintable(element))
		callback(element);
	}, function (element) {
	    if (element.attr("CBV_hint_number"))
		return;

	    try {
		if (element.css("cursor") != "pointer")
		    return;
	    } catch (e) {
		return;  // XML pages...
	    }
	    if (element.parent().css("cursor")=="pointer")
		return;

	    if (!clickable_space(element))
		return;

	    if (element.parent().attr("CBV_hint_number"))
		return;

	    if (element.has("[CBV_hint_number]").length != 0)
		return;

	    var saved = hinting_parameters;
	    hinting_parameters += "c";  // <<<>>>
	    callback(element);
	    hinting_parameters = saved;
	});
    }
}
