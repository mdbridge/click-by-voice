///
/// Overall control code for labeling elements with hint tags
///
/// Provides Hints

var Hints = null;

(function() {

    var next_CBV_hint_ = 0;  // -1 means hints are off
    var options_       = new Map();


    //
    // Main exported actions:
    //

    function add_hints(parameters) {
	set_hinting_parameters(parameters);
	place_hints();
    }

    function refresh_hints() {
	if (document.hidden) {
	    console.log("skipping refresh...");
	    return;
	}
	if (next_CBV_hint_ >= 0)
	    place_hints();
    }

    function remove_hints() {
	$("[CBV_hint_element]").remove();
	$("[CBV_hint_number]").removeAttr("CBV_hint_number");

	next_CBV_hint_ = -1;
    }


    //
    // Parameters for hinting:
    //

    function option(option_name) {
	return options_.has(option_name);
    }
    function option_value(option_name, default_value) {
	if (options_.has(option_name)) {
	    return options_.get(option_name);
	} else {
	    return default_value;
	}
    }

    function options_to_string() {
	var result = "";
	options_.forEach(function(value, key) {
	    if (result != "") {
		result += " ";
	    }
	    result += key;
	    if (value != undefined) {
		result += '{' + value + '}';
	    }
	});
	return result;
    }

    function set_hinting_parameters(value) {
	options_ = new Map();
	value = value.replace(/\$\{([^\}]*)\}/, function (x,argument){
	    options_.set('$', argument);
	    return "";
	});
	value = value.replace(/\^\{([^\}]*)\}/, function (x,argument){
	    options_.set('^', argument);
	    return "";
	});
	value = value.replace(/E([0-9])/, function (x,argument){
	    options_.set('E', argument);
	    return "";
	});
	for (var c of value) {
	    options_.set(c, undefined);
	}
    }

    function with_high_contrast(callback) {
	var saved = options_;
	options_= new Map(options_);
	options_.set('c', undefined);
	callback();
	options_ = saved;
    }


    //
    // 
    //

    function place_hints() {
	console.log("adding hints: " + options_to_string());

	if (next_CBV_hint_ < 0)
	    next_CBV_hint_ = 0;


	var start = performance.now();
	// FindHint.each_hintable(function(element) {});
	// console.log("  just FindHint.each_hintable time:   " + (performance.now()-start) + " ms");
	// start = performance.now();
	

	var delayed_work = [];
	FindHint.each_hintable(function(element) {
	    if (element.is("[CBV_hint_number]"))
		return;
	    element.attr("CBV_hint_number", next_CBV_hint_);

	    var delayed = AddHint.add_hint(element, next_CBV_hint_);
	    if (delayed)
		delayed_work.push(delayed);

	    next_CBV_hint_ += 1;
	});

	delayed_work.map(function (o) { o(); });


	// console.log("total hints assigned: " + next_CBV_hint_ 
	// 		+ "    (" + delayed_work.length + " overlays added)");
	// console.log("  " + (performance.now()-start) + " ms");
    }



    Hints = {
	add_hints	   : add_hints,
	refresh_hints	   : refresh_hints,
	remove_hints	   : remove_hints,

	option		   : option,
	option_value 	   : option_value,
	with_high_contrast : with_high_contrast,
    };
})();
