///
/// Overall control code for labeling elements with hint tags
///
/// Provides Hints

var Hints = null;

(function() {

    var next_CBV_hint	   = 0;  // -1 means hints are off
    var hinting_parameters = ""; // extra argument to :+ if any
    var target_selector_   = null;


    //
    // Main exported actions:
    //

    function add_hints(parameters) {
	set_hinting_parameters(parameters);
	place_hints();
    }

    function refresh_hints() {
	if (next_CBV_hint >= 0)
	    place_hints();
    }

    function remove_hints() {
	$("[CBV_hint_element]").remove();
	$("[CBV_hint_number]").removeAttr("CBV_hint_number");

	next_CBV_hint = -1;
    }


    //
    // Parameters for hinting:
    //

    function set_hinting_parameters(value) {
	target_selector_ = undefined;
	value = value.replace(/\$\{([^\}]*)\}/, function (x,argument){
	    target_selector_ = argument;
	    return "";
	});
	hinting_parameters = value;
    }

    function option(option_name) {
	return (hinting_parameters.indexOf(option_name) != -1);
    }

    function target_selector() {
	return target_selector_;
    }


    //
    // 
    //

    function place_hints() {
	console.log("adding hints: " + hinting_parameters 
		    + (target_selector_ ? "${"+target_selector_+"}" : ""));

	if (next_CBV_hint < 0)
	    next_CBV_hint = 0;


	var start = performance.now();
	// FindHint.each_hintable(function(element) {});
	// console.log("  just FindHint.each_hintable time:   " + (performance.now()-start) + " ms");
	// start = performance.now();
	

	var delayed_work = [];
	FindHint.each_hintable(function(element) {
	    if (element.is("[CBV_hint_number]"))
		return;
	    element.attr("CBV_hint_number", next_CBV_hint);

	    var delayed = AddHint.add_hint(element, next_CBV_hint);
	    if (delayed)
		delayed_work.push(delayed);

	    next_CBV_hint += 1;
	});

	delayed_work.map(function (o) { o(); });


	// console.log("total hints assigned: " + next_CBV_hint 
	// 		+ "    (" + delayed_work.length + " overlays added)");
	// console.log("  " + (performance.now()-start) + " ms");
    }



    Hints = {
	add_hints: add_hints,
	refresh_hints, refresh_hints,
	remove_hints: remove_hints,

	option: option,
	target_selector: target_selector,
    };
})();
