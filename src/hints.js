///
/// Overall control code for labeling elements with hint tags
///
/// Provides Hints
///

var Hints = null;

(function() {

    var config_	       = "";
    var next_CBV_hint_ = 0;  // -1 means hints are off
    var options_       = new Map();


    //
    // Main exported actions:
    //

    function set_config(config) {
	config_= config;
    }

    function add_hints(parameters) {
	set_hinting_parameters(parameters);
	if (option_value('+', 1) > 0) {
	    place_hints();
	} else {
	    console.log("not adding hints: " + options_to_string());
	    remove_hints();
	}
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
	AddHint.clear_work();
	remove_hints_from(document)
	next_CBV_hint_ = -1;
    }
    function remove_hints_from(from) {
	$("[CBV_hint_element]", from).remove();
	$("[CBV_hint_number]", from).removeAttr("CBV_hint_number");
	frame = $("iframe, frame", from);
	if (frame.length != 0) {
	    remove_hints_from(frame.contents());
	}
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
	// +/- are special cases:
	if (option_name == '-') {
	    options_.set('+', [0]);
	    return;
	} else if (option_name == '+') {
	    if (arguments.length > 0) {
		options_.set('+', arguments);
	    } else {
		options_.set('+', [option_value('+',0) + 1]);
	    }
	    return;
	}
	// syntax for long option names & reseting options:
	if (option_name == 'X') {
	    if (arguments.length > 0) {
		option_name = arguments[0];
		arguments = arguments.slice(1);
		if (/-$/.test(option_name)) {
		    // X{<option_name>-}
		    reset_option(option_name.substring(0, option_name.length-1));
		} else {
		    // X{<option_name>}<optional arguments>
		    set_option(option_name, arguments);
		}
	    }
	    return;
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
	    if (value.length==0 && key.length==1) {
		flags += key;
	    } else {
		result += ' ' + key + value.map(function (v) { return '{' + v + '}';}).join('');
	    }
	});
	return flags + result;
    }

    function parse_option(text) {
	if (m = text.match(/^\s+(.*)/)) {
	    text = m[1];
	}
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
	var text = get_effective_hints(value, window.location.href);
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

    function get_effective_hints(user_hints, url) {
	var without_comments = config_.replace(/^[ \t]*#.*\n/gm, "");
	var stanzas = without_comments.split(/\n(?:\s*\n)+/);

	var config_hints = "";
	for (const stanza of stanzas) {
	    var match;
	    if (match = stanza.match(/^when\s+(.+?)\s*\n((?:.|\n)*)/)) {
		var regex = match[1];
		var options = match[2].replace(/^\s+/gm,'').replace(/\s+$/gm, '').replace(/\n/gm,'');
		// console.log(regex, '=>' , options);
		if (new RegExp(regex).test(url)) {
		    // console.log("match!");
		    config_hints = config_hints + options
		}
	    } else {
		console.log("bad stanza:", stanza);
	    }
	}

	var default_hints = "h";
	return default_hints + config_hints + user_hints;
    }


    //
    // 
    //

    function place_hints() {
	console.log("adding hints: " + options_to_string());

	if (next_CBV_hint_ < 0)
	    next_CBV_hint_ = 0;

	var start_hint = next_CBV_hint_;
	var start = performance.now();

	// DomWalk.each_displaying(
	//     function (element, styles) {},
	//     function (element, styles) {},
	//     "");
	// console.log("  just DomWalk time:   " + (performance.now()-start) + " ms");
	// start = performance.now();

	// FindHint.each_hintable(function(element) {});
	// console.log("  just FindHint.each_hintable time:   " + (performance.now()-start) + " ms");
	// start = performance.now();

	FindHint.each_hintable(function(element) {
	    if (element[0].hasAttribute("CBV_hint_number"))
		return;

	    AddHint.add_hint(element, next_CBV_hint_);
	    next_CBV_hint_ += 1;
	});
	const work_start = performance.now();
	const result = AddHint.do_work();

	if (Hints.option("timing")) {
	    console.log(`+${next_CBV_hint_-start_hint}` +
			` -> ${next_CBV_hint_} hints` +
			` in ${time(start)}: ${time(start, work_start)}; ${result}`);
	}
    }



    Hints = {
	set_config	   : set_config,

	add_hints	   : add_hints,
	refresh_hints	   : refresh_hints,
	remove_hints	   : remove_hints,

	option		   : option,
	option_value 	   : option_value,
	with_high_contrast : with_high_contrast,
    };
})();
