///
/// Main routine
///

"use strict";


//
// When to refresh hints
//

// -1 means we are hidden
let next_major_refresh = 0;

function get_refresh_parameters() {
    return {
        minimum_refresh_delay:  parseInt(Hints.option_value("refresh_min",            1000)),
        maximum_refresh_delay:  parseInt(Hints.option_value("refresh",                3000)),
        maximum_refresh_cpu:    parseInt(Hints.option_value("refresh_max_cpu",        10))    /100,
        refresh_after_activate: parseInt(Hints.option_value("refresh_after_activate", 500)),
    };
}

// This runs even when our tab is in the background:
function maybe_refresh() {
    if (document.hidden) {
        if (next_major_refresh < 0)
            return;
        next_major_refresh = -1;
        Util.vlog(1, "stopping refreshing due to being hidden");
        return;
    }
    if (next_major_refresh < 0) {
        next_major_refresh = 0;
        Util.vlog(1, "resuming refreshing due to being unhidden");
    }

    const now = new Date().getTime();
    if (now <= next_major_refresh) {
        return;
    }

    const start_time = performance.now();
    Hints.refresh_hints();
    const last_refresh_time = performance.now() - start_time;

    const p = get_refresh_parameters();
    let delay_till_next_refresh = last_refresh_time *
                                  (1-p.maximum_refresh_cpu)/p.maximum_refresh_cpu;
    delay_till_next_refresh = Math.max(delay_till_next_refresh, p.minimum_refresh_delay);
    delay_till_next_refresh = Math.min(delay_till_next_refresh, p.maximum_refresh_delay);

    const estimated_refresh_cpu = last_refresh_time/(delay_till_next_refresh+last_refresh_time);
    if (Hints.option("timing")) {
        Util.vlog(2, `refresh took ${last_refresh_time.toFixed(1)} ms;` +
                     ` scheduling next refresh in ${delay_till_next_refresh.toFixed(1)} ms;` +
                     ` estimated refresh CPU ${(estimated_refresh_cpu*100).toFixed(1)}%`);
    }

    next_major_refresh = new Date().getTime() + delay_till_next_refresh;
}

function hints_replaced() {
    const p = get_refresh_parameters();
    // We don't know how long the next refresh will take so let's be aggressive.
    next_major_refresh = new Date().getTime() + p.minimum_refresh_delay;
}

function hint_activated() {
    const p = get_refresh_parameters();
    next_major_refresh = Math.min(next_major_refresh, 
                                  new Date().getTime() + p.refresh_after_activate);
}



//
// Performing operations
//

function perform_operation(operation, hint_descriptor) {
    if (operation == "blur") {
        document.activeElement.blur();
        return;
    }

    // handle legacy show hints commands, rewriting them to use =:
    if (/^(\+|-)/.test(operation)) {
        operation = '=' + operation;
    }
    if (/^once(\+|-)/.test(operation)) {
        operation = 'once=' + operation.substr(4);
    }

    if (operation.startsWith("=")) {
        act("set_initial_operation", {initial_operation: ":" + operation});
        Hints.remove_hints();
        Hints.add_hints(operation.substr(1));
        hints_replaced();
    } else if (operation.startsWith("once=")) {
        Hints.remove_hints();
        Hints.add_hints(operation.substr(5));
        hints_replaced();
    } else {
        Activate.goto_hint_descriptor(hint_descriptor, operation);
        hint_activated();
    }
}



//
// Startup of a page code
//

if (window == window.top) {
    // the following only runs outside of any iframes

    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            Util.vlog(0, `CBV Command: perform "${request.operation}" on "${request.hint_descriptor}"`);
            perform_operation(request.operation, request.hint_descriptor);
        });

    $(document).ready(function() {
        chrome.runtime.sendMessage({action: "get_per_session_options"}, function(response) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
            }
            Hints.set_config(response.config);
            // kludge: strip off (hopefully) leading colon:
            perform_operation(response.startingCommand.substring(1), "");
        });

        // try and let initial operation above do 1st hint placement,
        // but fall back on defaults if no response in five seconds:
        next_major_refresh = new Date().getTime() + 5000;
        setInterval(maybe_refresh, 50);
    });

} else {
    // Are we same origin as our parent?
    let sameOrigin = false;
    try {
        void window.parent.document;
        sameOrigin = true;
    } catch {}

    if (!sameOrigin) {
        console.log("Unable to provide hints for cross-origin", location.href);
    }
}
