///
/// Labeling elements with hint tags
///


var next_CBV_hint      = 0;  // -1 means hints are off

function remove_hints() {
    //console.log("removing hints");

    $("[CBV_hint_number]").removeAttr("CBV_hint_number");
    $("[CBV_hint_tag]").remove();

    next_CBV_hint = -1;
}


function set_important(element, item, value) {
    try {
	// jquery .css(-,-)  does not handle !important correctly:
	//element[0].style.setProperty(item, value, "important");
	element[0].style.setProperty(item, value);
    } catch (e) {
	// fallback for XML files:
	var style = element.attr("style");
	if (style)
	    style += " ";
	else
	    style = "";
	element.attr("style",  style + item + ": "+value+" !important;");
    }
}


function build_base_element() {
    var element = $("<span></span>");

    element.attr("CBV_hint_element", "true");
    // => display: inline !important *except* for print where its display: none !important

    // fallback versions of these in the style file for XML files:
    set_important(element, "overflow", "visible");
    set_important(element, "float", "none");

    return element;
}


function add_text(element, text) {
    element.attr("CBV_add_text", "true");  // activate style rules
    element.append(text);

    return element;
}


function build_hint(hint_number, use_overlay) {
    var outer = build_base_element();
    outer.attr("CBV_hint_tag", hint_number);

    if (use_overlay) {
	// add fallback versions of these in the style file for XML files
	outer.attr("CBV_outer_overlay", "true");

	set_important(outer, "position", "relative");
	set_important(outer, "text-align", "left");
	/* avoid any properties here that would give outer a nonzero height? */

	var inner = build_base_element();
	// add fallback versions of these in the style file for XML files
	inner.attr("CBV_inner_overlay", "true");

	set_important(inner, "position", "absolute");
	// IMPORTANT: need to have top, left set so offset(-[,-])
	//            works correctly on this element:
	set_important(inner, "top", "0");
	set_important(inner, "left", "0");

	set_important(inner, "width", "auto");
	set_important(inner, "height", "auto");
	set_important(inner, "clip", "auto");
	set_important(inner, "text-indent", " 0px");
	set_important(inner, "vertical-align", " top");
	set_important(inner, "z-index", " 1000");

	add_text(inner, hint_number);
	/* opacity: .75; */
	set_important(inner, "padding", "0px 2px 0px 2px");
	/* max-width:20px; max-height:10px; */
	set_important(inner, "border-style", "none");
	set_important(inner, "margin", "0px");

	if (option("c")) {
	    inner.attr("CBV_high_contrast", "true");
	    set_important(inner, "color", "red");
	} else {
	    set_important(inner, "color", "purple");
	}
	set_important(inner, "background-color", "white");
	set_important(inner, "font-weight", "bold");
	
	outer.append(inner);

    } else {
	// add fallback versions of these in the style file for XML files
	outer.attr("CBV_outer_inline", "true");

	set_important(outer, "position", "static");

	add_text(outer, hint_number);
	set_important(outer, "vertical-align", "center");
	set_important(outer, "align-self", "flex-start");
	/* max-width:20px; max-height:10px; */
	set_important(outer, "padding", "0px 2px 0px 2px");
	set_important(outer, "border-style", "solid");
	set_important(outer, "border-width", "1px");
	//set_important(outer, "border-radius", "2px");
	set_important(outer, "margin-left", "2px"); 

	if (option("c")) {
	    // add fallback versions of these in the style file for XML files
	    outer.attr("CBV_high_contrast", "true");

	    set_important(outer, "color", "black");
	    set_important(outer, "background-color", "yellow");
	}
    }

    return outer;
}


function has_inside(element) {
    // quick hack for now

    if (element.contents().length > 0)
	return true;
    if (element.is("div, span, a")) 
	return true;
    return false;
}

function can_put_span_inside(element) {
    // unconditionally _empty elements_ that cannot have any child
    // nodes (text or nested elements):
    if (element.is("area, base, br, col, command, embed, hr, img, input, keygen, link, meta, param, source, track, wbr")) 
	return false;

    if (element.is("select, option, textarea")) 
	return false;

    if (element.is("iframe")) 
	// iframe elements are displayed only if browser doesn't support iframe's
	return false;

    if (element.is("div, span, a, button, li")) 
	return true;


    // above absolutely correct; below is heuristic:

    if (element.is("th, td")) 
	return true;


    try {
	if (element.contents().length > 0)
	    return true;
    } catch (e) {}
    return false;
}


function insert_hint_tag(element, hint_tag, put_before, put_inside) {
    if (put_inside) {
	if (put_before)
	    element.prepend(hint_tag);
	else
	    element.append(hint_tag);
    } else {
	if (put_before)
	    element.before(hint_tag);
	else
	    element.after(hint_tag);
    }    
}

function add_hints() {
    console.log("adding hints: " + hinting_parameters + " target: " + target_selector);
    //console.log("@" + window.location.href);
    var start = performance.now();

    // each_hintable(function(element) {});
    // console.log("just each_hintable time:   " + (performance.now()-start) + " ms");
    // start = performance.now();
    
    if (next_CBV_hint < 0)
	next_CBV_hint = 0;

    each_hintable(function(element) {
	if (element.is("[CBV_hint_number]"))
	    return;
	element.attr("CBV_hint_number", next_CBV_hint);

	var put_inside	= false;
	var put_before	= option("b");
	var use_overlay = option("v");

	if (option("h")) {
	    if (element.is("a") && element.text().length > 30) {
		console.log(element[0]);
		use_overlay = false;
		put_before  = false;
	    } else {
		use_overlay = true;
	    }
	}
	if (option("y")) {
	    if (element.parents().is("p")) {
		use_overlay = false;
		put_before = false;
	    }
	}
	if (option("Z0")) {
	    try {
		if (element.contents().length == 1 && element.children().length == 0
		    && element.text().length > 0
		    && can_put_span_inside(element)) {
		    use_overlay = false;
		    put_before = false;
		    put_inside = true;
		} 

		// first check is to ensure no text or comment direct subnodes
		if (element.contents().length == 1
		    && element.contents().first().is("div, span, strong, i, b, em")) {
		    var candidate = element.children().first();
		    if (candidate.contents().length == 1 && candidate.children().length == 0
			&& candidate.text().length > 0
			&& can_put_span_inside(candidate)) {
			element = candidate;
			use_overlay = false;
			put_before = false;
			put_inside = true;
		    } 
		}
	    } catch (e) {}
	}

	if (option("Y")) {
	    var constrained = false;
	    element.parents().each(function(index) {
		if (constrained) 
		    return;

		if ($(this).css("overflow-x"))
		    if ($(this).css("overflow-x") != "visible"
			&& $(this).css("overflow-x") != "auto"
		       )
			constrained = true;

		if ($(this).css("overflow-y"))
		    if ($(this).css("overflow-y") != "visible"
			&& $(this).css("overflow") != "auto")
			constrained = true;

		// if ($(this).css("overflow"))
		//     if ($(this).css("overflow") != "visible"
		//        && $(this).css("overflow") != "auto") {

		if (constrained) {
		    console.log($(this)[0]);
		    console.log($(this).css("overflow-x"));
		    console.log($(this).css("overflow-y"));
		}
	    });
	    if (!constrained) {
		use_overlay = false;
		put_before = false;
	    }
	}



	var hint_tag = build_hint(next_CBV_hint, use_overlay);

	if (use_overlay) {
	    put_inside = can_put_span_inside(element);
	} else {
	    if (element.is("a") || element.is("button"))
		put_inside = true;

	    if (option("i") 
		&& (element.children().length>0
	            || element.text != ""))
		put_inside = true;

	    if (put_inside && option("ii")) {
		// first check is to ensure no text or comment direct subnodes
		if (element.contents().length == 1
		    && element.contents().first().is("div, span")) {
		    console.log(">> " + element.text());
		    element = element.children().first();
		}
	    }
	}

	// always put hints after tr elements (else messes up table
	// formatting as treats hint tag as first column):
	if (element.is("tr")) 
	     put_before = false;


	var old_children_number = element.children().length; // <<<>>>
	insert_hint_tag(element, hint_tag, put_before, put_inside);
	//$("body").append(hint_tag);

	if (use_overlay) {
	    try { // this fails for XML files... <<<>>>
		var offset = element.offset();
		if (option('e'))
		    offset.left +=  element.outerWidth() - hint_tag.children().first().outerWidth();

		if (option('E')) {
		    if (element.is("a") && old_children_number == 0) {
			offset.left += 4;
			offset.top  -= 4;
		    }
		}

		hint_tag.children().first().offset(offset);
	    } catch (e) {}
	}

	next_CBV_hint += 1;
    });

    // console.log("total hints assigned: " + next_CBV_hint);
    // console.log("  " + (performance.now()-start) + " ms");
}

function refresh_hints() {
    //console.log(document.activeElement);
    if (next_CBV_hint >= 0)
	add_hints();
}
