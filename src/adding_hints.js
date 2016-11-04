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
	element[0].style.setProperty(item, value, "important");
	//element[0].style.setProperty(item, value);
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
    // mark our inserted elements so we can distinguish them:
    element.attr("CBV_hint_element", "true"); 
    return element;
}

function add_text(element, text) {
    element.attr("CBV_add_text", "true");  // activate style rules
    if (option("c"))
	element.attr("CBV_high_contrast", "true");
    element.append(text);
    return element;
}

function build_hint(element, hint_number, use_overlay) {
    var outer = build_base_element();
    outer.attr("CBV_hint_tag", hint_number);

    if (use_overlay) {
	outer.attr("CBV_outer_overlay", "true");

	var inner = build_base_element();
	outer.append(inner);

	inner.attr("CBV_inner_overlay", "true");
	add_text(inner, hint_number);

	// IMPORTANT: need to have top, left set so offset(-[,-])
	//            works correctly on this element:
	set_important(inner, "top",  "0");
	set_important(inner, "left", "0");

	// try and allow some opacity:
	var opacity = element.css("opacity");
	if (opacity && opacity < .5)
	    set_important(inner, "opacity",  "1");
	else
	    set_important(inner, "opacity", opacity);

    } else {
	outer.attr("CBV_outer_inline", "true");
	add_text(outer, hint_number);
    }

    return outer;
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

    if (element.is("div, span, a, button, li, th, td")) 
	return true;

    // above absolutely correct; below is heuristic:

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


function prepare_hint (element) {
    var put_inside   = false;
    var put_before   = option("b");
    var use_overlay  = option("v");
    var displacement = 0;

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


    if (option('E')) {
	if (element.is("a") && element.children ().length == 0) {
	    displacement = 4;
	}
    }

    return {use_overlay:    use_overlay,
	    put_before:     put_before,
	    put_inside:     put_inside,
	    offset_end:     option('e'),
	    displacement:   displacement,
	    target_element: element};
}


function add_hints() {
    console.log("adding hints: " + hinting_parameters 
		+ (target_selector ? "$" + target_selector : ""));
    //console.log("@" + window.location.href);
    var start = performance.now();

    // each_hintable(function(element) {});
    // console.log("just each_hintable time:   " + (performance.now()-start) + " ms");
    // start = performance.now();
    
    if (next_CBV_hint < 0)
	next_CBV_hint = 0;

    var overlays = [];
    each_hintable(function(element) {
	if (element.is("[CBV_hint_number]"))
	    return;
	element.attr("CBV_hint_number", next_CBV_hint);

	var hint_info = prepare_hint(element);
	element = hint_info.target_element;
	var hint_tag  = build_hint(element, next_CBV_hint, hint_info.use_overlay);

	if (hint_info.use_overlay) {
	    hint_info.overlay_element = hint_tag.children().first();
	    overlays.push(hint_info);
	}

	insert_hint_tag(element, hint_tag, hint_info.put_before, hint_info.put_inside);
	//$("body").append(hint_tag);

	next_CBV_hint += 1;
    });

    overlays.map(function (o) {
	try { // this fails for XML files... <<<>>>
	    var offset = o.target_element.offset();
	    if (o.offset_end)
		offset.left += o.target_element .outerWidth() 
		             - o.overlay_element.outerWidth();
	    offset.left += o.displacement;
	    offset.top  -= o.displacement;
	    o.overlay_element.offset(offset);
	} catch (e) {}
    });


    // console.log("total hints assigned: " + next_CBV_hint 
    // 		+ "    (" + overlays.length + " overlays added)");
    // console.log("  " + (performance.now()-start) + " ms");
}

function refresh_hints() {
    //console.log(document.activeElement);
    if (next_CBV_hint >= 0)
	add_hints();
}
