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

    function reset_option(option_name) {
	options_.delete(option_name);
    }
    function set_option(option_name, arguments) {
	// The main mode switches are exclusive:
	if (/^[ioh]$/.test(option_name)) {
	    reset_option("i");
	    reset_option("o");
	    reset_option("h");
	}
	options_.set(option_name, arguments);
    }

    function option(option_name) {
	return options_.has(option_name);
    }
    function option_value(option_name, default_value) {
	if (options_.has(option_name) && options_.get(option_name).length>0) {
	    return options_.get(option_name)[0];
	} else {
	    return default_value;
	}
    }

    function options_to_string() {
	var result = "";
	var flags = "";
	options_.forEach(function(value, key) {
	    if (value.length == 0) {
		flags += key;
	    } else {
		result += ' ' + key + value.map(function (v) { return '{' + v + '}';}).join('');
	    }
	});
	return flags + " " + result;
    }

    function parse_option(text) {
	if (m = text.match(/^([^{])\{([^{}]*)\}\{([^{}]*)\}(.*)/)) {
	    return [m[1], [m[2],m[3]], m[4]];
	}
	if (m = text.match(/^([^{])\{([^{}]*)\}(.*)/)) {
	    return [m[1], [m[2]], m[3]];
	}
	return [text[0], [], text.substring(1)];
    }
    function set_hinting_parameters(value) {
	options_ = new Map();
	var text = value;
	while (text != "") {
	    // console.log(text);
	    r = parse_option(text);
	    name = r[0];
	    arguments = r[1];
	    text = r[2];
	    // console.log([name, arguments, text]);
	    set_option(name, arguments);
	}
    }

    function with_high_contrast(callback) {
	var saved = options_;
	options_= new Map(options_);
	set_option('c', []);
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
