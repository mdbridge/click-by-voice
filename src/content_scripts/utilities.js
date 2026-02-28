///
/// TBD
///
/// Provides Util

"use strict";

let Util = null;

(function() {

    let my_frame_id   = -1;
    let current_epoch = -1;


    // The top frame always has ID zero.
    function get_my_frame_id() {
        return my_frame_id;
    }

    function set_my_frame_id(frame_id) {
        my_frame_id = frame_id;
    }


    function get_epoch() {
        return current_epoch;
    }

    function set_epoch(epoch) {
        current_epoch = epoch;
    }


    function vlog(level) {
        const verbose_level = Hints.option_value("verbose", "0");
        if (level <= Number(verbose_level)) {
            return console.log.bind(console, my_frame_id);
        }
        return () => {};
    }


    function time(start, end) {
        if (!end) {
            end = performance.now();
        }
        return `${(end - start).toFixed(1)} ms`;
    }


    // Ascend traversing through shadow roots as needed.
    function getVisualParentElement(node) {
        const parent = node.parentNode;
        if (!parent) return null;  // Removed nodes, etc.

        // Handle parent Element (realm-safe)
        if (parent.nodeType === Node.ELEMENT_NODE) {
            return parent;
        }

        // Handle ShadowRoot
        if (parent.nodeType === Node.DOCUMENT_FRAGMENT_NODE &&
            parent.host &&
            parent.host.nodeType === Node.ELEMENT_NODE) {
            return parent.host;
        }

        // Note: You cannot traverse out of an iframe.
        return null;
    }

    function getVisualParent$Element($node) {
        let parentNode = getVisualParentElement($node[0]);
        if (parentNode) {
            return $(parentNode);
        }
        return null;
    }

    function is_in_shadow_root(node) {
        const root = node.getRootNode?.();
        return !!(root && root.nodeType === Node.DOCUMENT_FRAGMENT_NODE && root.host);
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


    //
    // Requesting background script to perform actions on our behalf
    //

    function act(action, args, epoch=current_epoch) {
        args.action = action;
        args.epoch  = epoch;
        chrome.runtime.sendMessage(args);
    }

    async function request(action, args, epoch=current_epoch) {
        args.action = action;
        args.epoch  = epoch;
        try {
            return await chrome.runtime.sendMessage(args);
        } catch (e) {
            if (e.message === "Extension context invalidated.") {
                return { rejected: true };
            }
            throw e;
        }
    }


    Util = {
        get_my_frame_id: get_my_frame_id,
        set_my_frame_id: set_my_frame_id,

        get_epoch: get_epoch,
        set_epoch: set_epoch,

        vlog: vlog,
        time: time,

        getVisualParentElement: getVisualParentElement,
        getVisualParent$Element: getVisualParent$Element,
        is_in_shadow_root: is_in_shadow_root,

        css: css,
        css_number: css_number,
        css_pixels: css_pixels,
        is_under_low_opacity: is_under_low_opacity,

        act: act,
        request: request,
    };

})();



//
// <<<>>>
//

function CBV_inserted_element($element) {
    return $element[0].getAttribute("CBV_hint_element") == "true";
}
