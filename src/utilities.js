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


    //
    // Inspecting (safely) CSS properties
    //

    function css($element, property_name, default_value=undefined) {
        try {
            return $element.css(property_name);
        } catch (e) {
            // the jQuery method .css throws an exception on XML elements
            return default_value;
        }
    }

    // Here we expect the property to hold a value convertible to pixels.
    // You must handle values like "none" separately.
    function css_pixels($element, property_name, default_value=0, unparsable_value=0) {
        // Note that this gives a computed style value, which has
        // resolved different units, etc.
        const value = css($element, property_name, undefined);
        if (value === undefined) {
            return default_value;
        }
        if (/^-?[0-9]+(\.[0-9]*)?px$/.test(value))
            return parseFloat(value);
        if (/^-?[0-9]+(\.[0-9]*)?%$/.test(value))
            return $element.parent().width() * parseFloat(value);
        return unparsable_value;
    }

    // Here we expect the property to hold an integer or float number.
    function css_number($element, property_name, default_value, unparsable_value=0) {
        const value = css($element, property_name, undefined);
        if (value === undefined) {
            return default_value;
        }
        if (/^-?[0-9]+(.[0-9]*)?(e-?[0-9]+)?$/.test(value))
            return parseFloat(value);
        console.error(`property ${property_name} fails to have a numeric value: ${value}`);
        return unparsable_value;
    }


    // Is element's effective opacity low enough that we should regard it as hidden?
    function is_under_low_opacity(element) {
        let current_element = element;
        while (current_element) {
            const opacity = css_number($(current_element), "opacity", 1, 1);
            if (opacity < 0.05) {
                break;
            }
            current_element = current_element.parentElement;
        }
        if (!current_element) {
            return false;
        }

        // Technically we should verify that there is no new stacking
        // context created between current_element and element.
        // Skipping because I think it's unlikely that would happen.

        return true;
    }


    Util = {
        time: time,
        vlog: vlog,

        css: css,
        css_number: css_number,
        css_pixels: css_pixels,
        is_under_low_opacity: is_under_low_opacity,
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
// <<<>>>
//

function CBV_inserted_element($element) {
    return $element[0].getAttribute("CBV_hint_element") == "true";
}
