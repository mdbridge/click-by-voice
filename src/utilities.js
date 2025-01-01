///
/// TBD
///
/// Provides Util

"use strict";

let Util = null;

(function() {

    function vlog(level, ...args) {
        const verbose_level = Hints.option_value("verbose", "0");
        if (level <= Number(verbose_level)) {
            console.log(...args);
        }
    }


    function time(start, end) {
        if (!end) {
            end = performance.now();
        }
        return `${(end - start).toFixed(1)} ms`;
    }


    Util = {
        time: time,
        vlog: vlog
    };
})();









//
// Requesting background script to perform actions on our behalf
//

function act(action, args) {
    args.action = action;
    chrome.runtime.sendMessage(args);
}

function request(action, args, callback) {
    args.action = action;
    chrome.runtime.sendMessage(args, callback);
}



//
// Inspecting (safely) CSS properties
//

// omitting default_value gives a default of undefined
function css($element, property_name, default_value) {
    try {
        return $element.css(property_name);
    } catch (e) {
        // the jQuery method .css throws an exception on XML elements
        return default_value;
    }
}



//
// <<<>>>
//

function CBV_inserted_element($element) {
    return $element[0].getAttribute("CBV_hint_element") == "true";
}
