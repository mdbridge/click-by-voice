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


// var i = 0;
function build_base_element() {
    var element = $("<span></span>");

    // display: inline !important *except* for print where its display: none !important
    element.attr("CBV_hint_element", "true");

    element.css("word-break", "normal");  // prevent breaking of hint numbers

    return element;
}

function build_hint(hint_number) {
    var element = build_base_element();

    element.attr("CBV_hint_tag", hint_number);

    if (option("c"))
	element.attr("CBV_high_contrast", "true");
    else
	element.attr("CBV_low_contrast", "true");

    if (option("v")) {
	element.attr("CBV_hint_overlay", "true");
	var inner = build_base_element();
	inner.attr("CBV_inter_hint_tag", "true");
	inner.append(hint_number);
	element.append(inner);
    } else {
	element.attr("CBV_hint_inline", "true");
	element.append(hint_number);
    }

    return element;
}


function has_inside(element) {
    // quick hack for now

    if (element.contents().length > 0)
	return true;
    if (element.is("div, span, a")) 
	return true;
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
    console.log("adding hints: " + hinting_parameters);

    if (next_CBV_hint < 0)
	next_CBV_hint = 0;

    each_hintable(function(element) {
	if (element.is("[CBV_hint_number]"))
	    return;
	element.attr("CBV_hint_number", next_CBV_hint);

	var hint_tag = build_hint(next_CBV_hint);

	var put_inside = false;
	if (option("v")) {
	    put_inside = has_inside(element);
	    // if (put_inside) {
	    // 	//try {
	    // 	    var v;
	    // 	    if ((v = element.css("padding-top")) && !/^-/.test(v))
	    // 		hint_tag.css("top", "-" + v);
	    // 	    if ((v = element.css("padding-left")) && !/^-/.test(v))
	    // 		hint_tag.css("left", "-" + v);
	    // 	//console.log(v);
	    // 	//console.log(hint_tag[0]);
	    // 	//} catch (e) {}
	    // }

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


	var put_before = option("b");

	// always put hints after tr elements (else messes up table
	// formatting as treats hint tag as first column):
	if (element.is("tr")) 
	     put_before = false;


	insert_hint_tag(element, hint_tag, put_before, put_inside);
	if (option("v")) {
//	    if (put_inside) {
		//try {

		// var p = element.position();
		// var h = hint_tag.position();
		// hint_tag.css("top", p.top - h.top);
		// hint_tag.css("left", p.left - h.left);

		hint_tag.offset(element.offset());
		//console.log(v);
		//console.log(hint_tag[0]);
		//} catch (e) {}
//	    }
	}

// 	i += 1;
// 	var c;
// 	switch (Math.floor(i/27)%7) {
// 	case 0: c = "red"; break;
// 	case 3: c = "#50a033"; break;
// 	case 5: c = "green"; break;
// 	case 6: c = "purple"; break;
// 	default:
// 	    c = "purple";
// 	}
// 	// console.log(hint_tag[0]);
// //	hint_tag.children().first().css("color", c + " ! important");
// try {
// 	hint_tag.children().first()[0].style.setProperty("color",c,"important");
// } catch ( e) {
    
// }
	// console.log(hint_tag[0]);
	// hint_tag.children().first().css("color", c);
	// console.log(hint_tag[0]);



	next_CBV_hint += 1;
    });

    //console.log("total hints assigned: " + next_CBV_hint);
}

function refresh_hints() {
    //console.log(document.activeElement);
    if (next_CBV_hint >= 0)
	add_hints();
}
