///
/// Overall control code for labeling elements with hint tags
///
/// Provides Hints
///

"use strict";

var Hints = null;

(function() {

    let config_     = "";
    let hinting_on_ = true;
    let options_    = new Map();


    //
    // Main exported actions:
    //

    function set_config(config) {
        config_= config;
    }

    function add_hints(parameters) {
        set_hinting_parameters(parameters);
        if (option_value('+', 1) > 0) {
            hinting_on_ = true;
            place_hints(false);
        } else {
            Util.vlog(0, "not adding hints: " + options_to_string());
            remove_hints();
        }
    }

    function refresh_hints() {
        if (hinting_on_)
            place_hints(true);
    }

    function remove_hints() {
        HintManager.discard_hints();
        HintManager.add_hint_number_block(0, 100000); // <<<>>>
        remove_hints_from(document)
        hinting_on_ = false;
    }
    function remove_hints_from(from) {
        // This doesn't search open shadow roots, but we should not
        // have put any hint elements there so that's okay.
        $("[CBV_hint_element]", from).remove();
        const $iframe = $("iframe", from);
        if ($iframe.length != 0) {
            remove_hints_from($iframe.contents());
        }
    }

    //
    // Parameters for hinting:
    //

    function reset_option(option_name) {
        options_.delete(option_name);
    }
    function set_option(option_name, args) {
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
            if (args.length > 0) {
                options_.set('+', args);
            } else {
                options_.set('+', [option_value('+',0) + 1]);
            }
            return;
        }
        // syntax for long option names & reseting options:
        if (option_name == 'X') {
            if (args.length > 0) {
                option_name = args[0];
                args = args.slice(1);
                if (/-$/.test(option_name)) {
                    // X{<option_name>-}
                    reset_option(option_name.substring(0, option_name.length-1));
                } else {
                    // X{<option_name>}<optional arguments>
                    set_option(option_name, args);
                }
            }
            return;
        }
        options_.set(option_name, args);
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
        let result = "";
        let flags = "";
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
        let m;
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
        let text = get_effective_hints(value, window.location.href);
        while (text != "") {
            // console.log(text);
            const r = parse_option(text);
            const name = r[0];
            const args = r[1];
            text = r[2];
            // console.log([name, args, text]);
            set_option(name, args);
        }
    }


    //
    // 
    //

    function get_effective_hints(user_hints, url) {
        // Config stanzas are separated by one or more blank lines:
        const without_trailing_whitespace = config_.replace(/[ \t]+$/gm, "");
        const stanzas                     = without_trailing_whitespace.split(/\n\n+/);

        let config_hints = "";
        for (let stanza of stanzas) {
            // Comments are # at beginning of line (possibly indented) to end of line:
            // (CSS selectors can contain #'s)
            stanza = stanza.replace(/^[ \t]*#.*$/gm, "");
            // Remove any blank lines inside the stanza that result from removing comments:
            stanza = stanza.replace(/^\n/gm, "");

            let match;
            if (match = stanza.match(/^when +(.+?) *\n((?:.|\n)*)/)) {
                const regex = match[1];
                // Remove obviously unnecessary whitespace at beginning and end of lines, newlines:
                // (CSS selectors can contain spaces; we do not allow them to span lines)
                const options = match[2].replace(/^\s+/gm,'').replace(/\s+$/gm, '').replace(/\n/gm,'');
                // console.log(`${regex} => ${options}`);
                if (new RegExp(regex).test(url)) {
                    // console.log("match!");
                    config_hints += options
                }
            } else if (stanza != '') {
                console.error("Bad click-by-voice config stanza:\n", stanza);
            }
        }

        const default_hints = "h";
        return default_hints + config_hints + user_hints;
    }


    //
    // 
    //

    function collect_unhinted_hintables() {
        // Temporarily uncomment code here to measuring pure steps.

        // const start = performance.now();

        // DomWalk.each_displaying(
        //     function (element, styles) {},
        //     function (element, styles) {},
        //     "");
        // console.log("  just DomWalk time:   " + (performance.now()-start) + " ms");
        // start = performance.now();

        // FindHint.each_hintable(function(element) {});
        // console.log("  just FindHint.each_hintable time:   " + (performance.now()-start) + " ms");

        let unhinted_hintables = [];
        FindHint.each_hintable(function($element, reason) {
            if (HintManager.is_hinted_element($element[0]))
                return;
            unhinted_hintables.push({$element: $element, reason: reason});
        });
        return unhinted_hintables;
    }

    function add_hints_to_hintables(hintables_info) {
        hintables_info.forEach(({ $element, reason }) => {
            // Later will need to check for $element[0] having become unconnected <<<>>>
            if (HintManager.is_hinted_element($element[0]))
                return;

            const force_high_contrast =
                  (reason === "cursor: pointer") && Hints.option("C");
            AddHint.add_hint($element, force_high_contrast);
        });
    }

    function place_hints(refreshing) {
        if (!refreshing) {
            Util.vlog(0, "adding hints: " + options_to_string());
        }

        const starting_hint_count = HintManager.get_hint_number_stats().hints_made;
        const start               = performance.now();

        const unhinted_hintables = collect_unhinted_hintables();

        const needed_hint_numbers = unhinted_hintables.length;
        if (needed_hint_numbers > 0) {
            Util.vlog(1, `found ${needed_hint_numbers} elements that need hints`);
        }

        add_hints_to_hintables(unhinted_hintables);

        const work_start = performance.now();
        Batcher.sensing( () => { HintManager.adjust_hints(); } );
        const result = Batcher.do_work();

        const stats      = HintManager.get_hint_number_stats();
        const hints_made = stats.hints_made - starting_hint_count;
        if (Hints.option("timing") || hints_made > 0) {
            const max_hint_number = stats.max_hint_number_used;
            const hints_in_use    = stats.hints_in_use;
            Util.vlog(1, `+${hints_made} -> ${hints_in_use} hints` +
                      ` (number high water ${max_hint_number})` +
                      ` in ${Util.time(start)}: walk: ${Util.time(start, work_start)};` +
                      ` add/adjust: ${result}`);

            // for (let i = 1; i < 10; i++) {
            //     Batcher.sensing( () => { HintManager.adjust_hints(); } );
            //     console.log("again: " +Batcher.do_work());                
            // }
        }
    }



    Hints = {
        set_config:          set_config,

        add_hints:           add_hints,
        refresh_hints:       refresh_hints,
        remove_hints:        remove_hints,

        option:              option,
        option_value:        option_value,
    };
})();
