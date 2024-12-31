///
/// TBD
///
/// Provides Util

let Util = null;

(function() {

    function vlog(level, ...arguments) {
        const verbose_level = Hints.option_value("verbose", 0);
        if (verbose_level && level <= Number(verbose_level)) {
            console.log(...arguments);
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

function act(action, arguments) {
    arguments.action = action;
    chrome.runtime.sendMessage(arguments);
}

function request(action, arguments, callback) {
    arguments.action = action;
    chrome.runtime.sendMessage(arguments, callback);
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
