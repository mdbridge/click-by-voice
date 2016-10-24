///
/// Code for figuring out which elements of the webpage should be hinted
///


function disabled_or_hidden(element) {
    try {
	// Jquery gives an error error for this if no CSS (e.g., XML files):
	if (element.css("display") == "none")
	    return true;
    } catch (e) {}

    // ignore aria-hidden as it is used to hide relevant elements like search icons...
    // if (element.attr("aria-hidden") == "true")
    // 	return true;

    return false;
}


function CBV_inserted_element(element) {
    return element.attr("CBV_hint_tag")
	|| element.attr("CBV_inter_hint_tag");
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
    if (option("II")) {
	$("div").each(function(index) {
	    if ($(this).css("background-image") != "none" &&
		$(this).parent().css("background-image") == "none")
		inner_callback($(this));
	});
    }
    // just a particular element kind:
    var kind = "";
    if (option("I"))
	kind = "img";
    else if (option("S"))
	kind = "span";
    else if (option("D"))
	kind = "div";
    else if (option("L"))
	kind = "li";
    else if (option("R"))
	kind = "[role]";
    if (kind != "") {
	console.log("hinting: " + kind);
	$(kind).each(function(index) {
	    inner_callback($(this));
	});
	return;
    }
    if (option("FB")) {
	$("th").each(function(index) {
	    var element = $(this);
	    if (/^C\d+[ON]L\d+$/.test(element.attr("id")))
		inner_callback($(this));
	});
	//return;
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

    $("select, textarea").each(function(index) {
	inner_callback($(this));
    });

    $("keygen").each(function(index) {
	inner_callback($(this));
    });


    //
    // HTML elements directly made clickable or focusable
    //

    $("[onclick]").each(function(index) {
	inner_callback($(this));
    });

    $("[tabindex]").each(function(index) {
	if ($(this).attr("tabindex") != "-1")
	    inner_callback($(this));
    });


    //
    // HTML elements that might be clickable due to event listeners or
    // focusable via tabindex=-1
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

    $("li").each(function(index) {
	try {
	    if ($(this).css("cursor")=="pointer")
		inner_callback($(this));
	} catch ( e) {}
    });



    if (!option("+"))
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
	var element = $(this);
	try {
	    // Jquery gives errors for these if they are auto due to
	    // no CSS (e.g., XML files):
	    if (element.outerHeight(true)<8 
		|| element.outerWidth(true)<8)
		return;
	} catch (e) {}
	if (element.children().length > 0 || CBV_inserted_element(element))
	    return;
	
	inner_callback(element);
    });
}
