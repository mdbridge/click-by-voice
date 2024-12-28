///
/// Main routine
///

var next_major_refresh = 0;
function major_happened() {
    const major_delay = parseInt(Hints.option_value("refresh", 3000));
    next_major_refresh = new Date().getTime() + major_delay;
}

// This runs even when our tab is in the background:
function maybe_refresh() {
    const now = new Date().getTime();
    if (now > next_major_refresh) {
        Hints.refresh_hints();
        major_happened();
    }
}


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
        major_happened();
    } else if (operation.startsWith("once=")) {
        Hints.remove_hints();
        Hints.add_hints(operation.substr(5));
        major_happened();
    } else {
        Activate.goto_hint_descriptor(hint_descriptor, operation);
        next_major_refresh = new Date().getTime() + 
            parseInt(Hints.option_value("refresh_after_activate", 500));
    }
}

if (window == window.top) {
    // the following only runs outside of any [i]frames

    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
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
        setInterval(maybe_refresh, 100);
    });

}
