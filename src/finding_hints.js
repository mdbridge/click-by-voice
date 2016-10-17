//
// Labeling elements with hint tags
//

var next_CBV_hint      = 0;  // -1 means hints are off

function disabled_or_hidden(element) {
    try {
	// Jquery gives an error error for this if no CSS (e.g., XML files):
	if (element.css("display") == "none")
	    return true;
    } catch (e) {}
    if (element.attr("aria-hidden") == "true")
	return true;

    return false;
}

// Enumerate each element that we should hint, possibly more than once:
function each_hintable(callback) {
    inner_callback = function(element) {
	if (!disabled_or_hidden(element))
	    callback(element);
    };


    //
    // Experiments:
    //
    if (hinting_parameters.indexOf("II") != -1) {
	$("div").each(function(index) {
	    if ($(this).css("background-image") != "none" &&
		$(this).parent().css("background-image") == "none")
		inner_callback($(this));
	});
    }
    // just a particular element kind:
    var kind = "";
    if (hinting_parameters.indexOf("I") != -1)
	kind = "img";
    else if (hinting_parameters.indexOf("S") != -1)
	kind = "span";
    else if (hinting_parameters.indexOf("D") != -1)
	kind = "div";
    else if (hinting_parameters.indexOf("L") != -1)
	kind = "li";
    else if (hinting_parameters.indexOf("R") != -1)
	kind = "[role]";
    if (kind != "") {
	console.log("hinting: " + kind);
	$(kind).each(function(index) {
	    inner_callback($(this));
	});
	return;
    }


    //
    // Standard clickable or focusable HTML elements
    //

    // Quora has placeholder links with click handlers...
    //$("a[href]").each(function(index) {
    $("a").each(function(index) {
	inner_callback($(this));
    });

    $("button").each(function(index) {
	inner_callback($(this));
    });

    $("input").each(function(index) {
	var input_type = $(this).attr("type");
	if (input_type)
	    input_type = input_type.toLowerCase();
	var usable = true;
	if (input_type == "hidden") 
	    usable = false;
	if ($(this).attr("disabled") == "true")
	    usable = false;

	if (usable)
	    inner_callback($(this));
    });

    $("select").each(function(index) {
	inner_callback($(this));
    });

    $("keygen").each(function(index) {
	inner_callback($(this));
    });


    //
    // non-Standard HTML elements directly made clickable or focusable
    //

    $("[onclick]").each(function(index) {
	inner_callback($(this));
    });

    $("[tabindex]").each(function(index) {
	if ($(this).attr("tabindex") != "-1")
	    inner_callback($(this));
    });


    //
    // non-Standard HTML elements that might be clickable due to event
    // listeners or focusable via tabindex=-1
    //

    $("[role]").each(function(index) {
	var role = $(this).attr("role");
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
	    inner_callback($(this));
	    break;
	}
    });



    if (hinting_parameters.indexOf("+") == -1)
	return;

    //
    // anything we think likely to be clickable or focusable
    //

    // this is *everything* focusable:
    $("[tabindex]").each(function(index) {
	inner_callback($(this));
    });

    $("li").each(function(index) {
	inner_callback($(this));
    });

    // innermost div/span/img's are tempting click targets
    $("div, span, img").each(function(index) {
	try {
	    // Jquery gives errors for these if they are auto due to no CSS (e.g., XML files):
	    if ($(this).outerHeight(true)<8 
		|| $(this).outerWidth(true)<8)
		return;
	} catch (e) {}
	if ($(this).children().length > 0
	    || $(this).attr("CBV_hint_tag"))
	    return;
	
	inner_callback($(this));
    });
}
