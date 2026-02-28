///
/// Main routine
///

"use strict";


// Returns work time taken in milliseconds.
async function do_refresh(full_refresh, show_hint_parameters) {
    if (full_refresh) {
        const removal_time = await Hints.remove_hints();
        return removal_time + await Hints.add_hints(show_hint_parameters);
    } else {
        return await Hints.refresh_hints();
    }
}


//
// When to refresh hints
//

// -1 means we are hidden
let next_major_refresh = 0;

// State for async refresh control
let refresh_in_progress          = false;
let full_refresh_requested       = false;
let pending_show_hint_parameters = "";       // used when full_refresh_requested is true.


function get_refresh_parameters() {
    return {
        minimum_refresh_delay:  parseInt(Hints.option_value("refresh_min",            1000)),
        maximum_refresh_delay:  parseInt(Hints.option_value("refresh",                3000)),
        maximum_refresh_cpu:    parseInt(Hints.option_value("refresh_max_cpu",        10))    /100,
        refresh_after_activate: parseInt(Hints.option_value("refresh_after_activate", 500)),
    };
}

// This is run every 50 ms for frames with refreshing once we have started.
function maybe_refresh() {
    // Run at most one refresh at a time.
    if (refresh_in_progress) {
        return;
    }

    // This functions runs even when our tab is in the background;
    // avoid refreshing in that case.
    if (document.hidden) {
        if (next_major_refresh < 0)
            return;
        next_major_refresh = -1;
        Util.vlog(1)("stopping refreshing due to being hidden");
        return;
    }
    if (next_major_refresh < 0) {
        next_major_refresh = 0;
        Util.vlog(1)("resuming refreshing due to being unhidden");
    }

    if (! full_refresh_requested) {
        const now = new Date().getTime();
        if (now <= next_major_refresh) {
            return;
        }
    }

    refresh_in_progress      = true;
    const doing_full_request = full_refresh_requested;
    full_refresh_requested   = false;

    do_refresh(doing_full_request, pending_show_hint_parameters).then((work_time_taken) => {
        const last_refresh_time = work_time_taken;
        const p = get_refresh_parameters();
        if (doing_full_request) {
            // We don't know how long the next refresh will take so let's be aggressive.
            next_major_refresh = new Date().getTime() + p.minimum_refresh_delay;
        } else {
            let delay_till_next_refresh = last_refresh_time *
                (1-p.maximum_refresh_cpu)/p.maximum_refresh_cpu;
            delay_till_next_refresh = Math.max(delay_till_next_refresh, p.minimum_refresh_delay);
            delay_till_next_refresh = Math.min(delay_till_next_refresh, p.maximum_refresh_delay);

            const estimated_refresh_cpu = last_refresh_time
                                          / (delay_till_next_refresh+last_refresh_time);
            if (Hints.option("timing")) {
                Util.vlog(2)(`refresh took ${last_refresh_time.toFixed(1)} ms;` +
                          ` scheduling next refresh in ${delay_till_next_refresh.toFixed(1)} ms;` +
                          ` estimated refresh CPU ${(estimated_refresh_cpu*100).toFixed(1)}%`);
            }

            next_major_refresh = new Date().getTime() + delay_till_next_refresh;
        }
    }).catch(err => {
        console.error("CBV: Error during refresh:", err);
    }).finally(() => {
        refresh_in_progress    = false;
    });
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

    Activate.goto_hint_descriptor(hint_descriptor, operation);
    hint_activated();
}


function handle_service_worker_request(request, sendResponse) {
    console.log(request); // <<<>>>
    const type = request.type;
    const data = request.data;
    const frame_id = request.frame_id;

    switch (type) {
    case "CBV_NEW_EPOCH":
        {
            Util.set_my_frame_id(frame_id);
            if (data.epoch <= Util.get_epoch()) {
                Util.vlog(1)(`Ignoring stale epoch ${data.epoch} (current: ${Util.get_epoch()})`); // <<<>>>
                break;
            }

            Util.set_epoch(data.epoch);
            Util.vlog(0)(`New CBV epoch ${data.epoch}` +
                      ` with show_hints "${data.show_hint_parameters}"`);

            Hints.set_config(data.config.config);
            full_refresh_requested       = true;
            pending_show_hint_parameters = data.show_hint_parameters;
        }
        break;

    case "CBV_PERFORM":
        {
            Util.vlog(0)(`CBV Command: perform "${data.operation}" on "${data.hint_descriptor}"`);
            perform_operation(data.operation, data.hint_descriptor);
        }
        break;

    default:
        console.log(`Unknown CBV service worker message type: ${type}`);
        break;
    }
}


//
// Startup of a frame code; this code runs inside of each frame
//

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        handle_service_worker_request(request, sendResponse);
    });

$(document).ready(function() {
    Util.act("CBV_HELLO", {});
    setInterval(maybe_refresh, 50);
});
