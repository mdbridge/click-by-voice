///
/// Code for figuring out which elements of the webpage should be hinted
///

function CBV_inserted_element(element) {
    return element.attr("CBV_hint_element") == "true";
}


function each_displaying_helper(element, callback) {
    if (CBV_inserted_element(element))
    	return;

    try {
	// Jquery gives an error error for this if no CSS (e.g., XML files):
	if (element.css("display") == "none")
	    return true;
    } catch (e) {}

    callback(element);

    element.children().each(function(index) {
	each_displaying_helper($(this), callback);
    });
}

// Enumerate each webpage element that is displayed (that is, has a
// display property other than none *and* all its parents have display
// properties other than none).
function each_displaying(callback) {
    var root = $("body");
    each_displaying_helper(root, callback);
}



function hintable(element) {
    //
    // Experiments:
    //
    if (option("II")) {
	if (element.is("div")) {
	    if (element.css("background-image") != "none" &&
		element.parent().css("background-image") == "none")
		return true;
	}
    }

    // just a particular element kind:
    if (option("I"))
	return element.is("img");
    if (option("S"))
	return element.is("span");
    if (option("D"))
	return element.is("div");
    if (option("L"))
	return element.is("li");
    if (option("R"))
	return element.is("[role]");

    if (option("FB")) {
	if (element.is("th")) {
	    if (/^C\d+[ON]L\d+$/.test(element.attr("id")))
		return true;
	}
    }



    //
    // Standard clickable or focusable HTML elements
    //
    //   Quora has placeholder links with click handlers so allow a's
    //   w/o hrefs...
    //
    if (element.is("a, button, select, textarea, keygen"))
	return true;

    if (element.is("input")) {
	var input_type = element.attr("type");
	if (input_type)
	    input_type = input_type.toLowerCase();
	if (input_type != "hidden" && element.attr("disabled") != "true")
	    return true;
    }


    //
    // HTML elements directly made clickable or focusable
    //
    if (element.is("[onclick]")) 
	return true;
    if (element.is("[tabindex]")) 
	return element.attr("tabindex") != "-1";


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

    if (element.is("li")) {
	try {
	    if (element.css("cursor")=="pointer")
		return true;
	} catch (e) {}
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
	var too_small = false;
	try {
	    // Jquery gives errors for these if they are auto due to
	    // no CSS (e.g., XML files):
	    if (element.outerHeight(true)<8 
		|| element.outerWidth(true)<8)
		too_small = true;
	} catch (e) {}
	if (!too_small && element.children().length == 0)
	    return true;
    }


    return false;
}


// Enumerate each element that we should hint:
function each_hintable(callback) {
    each_displaying(function (element) {
	if (hintable(element))
	    callback(element);
    });
}


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


// Enumerate each element that we should hint, possibly more than once:
function each_old_hintable(callback) {
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
