///
/// TBD
///
/// Provides Hint

let Hint = null;

(function() {

    let hint_number_to_hint = new Map();
    let hinted_elements     = new WeakSet();


    //
    // Managing hint numbers
    //

    let next_hint_number     = 0;
    let hints_made           = 0;  // reset by discard_hints()
    let max_hint_number_used = -1; // reset by discard_hints()
    let retired_hint_numbers = new Set();

    function _discard_hint_numbers() {
        next_hint_number     = 0;
        hints_made           = 0;
        max_hint_number_used = -1;
        retired_hint_numbers = new Set();
    }

    function _allocate_hint_number() {
        hints_made++;
        if (!Hints.option("avoiding_reuse") && retired_hint_numbers.size > 0) {
            const first_inserted = retired_hint_numbers.values().next().value;
            retired_hint_numbers.delete(first_inserted);
            Util.vlog(2, `reusing hint number ${first_inserted}`);
            return first_inserted;
        }

        max_hint_number_used = next_hint_number++;
        return max_hint_number_used;
    }

    function _discard_hint_number(hint_number) {
        retired_hint_numbers.add(hint_number);
    }

    // reset by discard_hints()
    function get_hints_made() {
        return hints_made;
    }

    // reset by discard_hints()
    function get_max_hint_number_used() {
        return max_hint_number_used;
    }

    function get_hints_in_use() {
        return hint_number_to_hint.size;
    }


    //
    // Creating hints
    //

    function make_hint(hinted_element) {
        const hint_number = _allocate_hint_number();
        let hint = {
            hint_number:    hint_number,
            hinted_element: new WeakRef(hinted_element),
            hint_tag:       undefined
        };

        hint_number_to_hint.set(hint_number, hint);
        hinted_elements.add(hinted_element);

        if (Hints.option("mark_hinted")) {
            // Optionally for debugging mark the hinted element in the DOM.
            $(hinted_element).attr("CBV_hint_number", hint_number);
        }

        return hint;
    }

    function initialize_hint(hint, hint_tag) {
        hint.hint_tag = hint_tag;
    }


    //
    // Keeping track of hints
    //
    
    function locate_hint(hint_number) {
        return hint_number_to_hint.get(Number(hint_number));
    }

    function is_hinted_element(element) {
        return hinted_elements.has(element);
    }

    function discard_hints() {
        _discard_hint_numbers();
        hint_number_to_hint.clear();
        hinted_elements = new WeakSet();
        _remove_hint_numbers_from(document);
    }
    function _remove_hint_numbers_from(from) {
        $("[CBV_hint_number]", from).removeAttr("CBV_hint_number");
        const $frame = $("iframe, frame", from);
        if ($frame.length != 0) {
            _remove_hint_numbers_from($frame.contents());
        }
    }


    //
    // Operations on hints
    //
    
    // Dump hint information to console.
    function dump_hint(hint) {
        console.log(`Hint information for hint number ${hint.hint_number}:`);
        console.log(hint);
        const hinted_element = hint.hinted_element.deref();
        if (hinted_element) {
            console.log(hinted_element);
        } else {
            console.log("hinted element has been garbage collected");
        }
        console.log(hint.hint_tag);
    }

    function get_hinted_element(hint) {
        const element = hint.hinted_element.deref();
        if (!element) {
            console.log(`The element that had hint ${hint.hint_number} longer exists`);
            return undefined;
        }
        if (!element.isConnected) {
            console.log(`The element with hint ${hint.hint_number} is no longer connected`);
            return undefined;
        }
        return element;
    }

    // precondition: currently in a sensing step
    function adjust_hint(hint) {
        const hinted_element = hint.hinted_element.deref();
        if (!hinted_element || !hinted_element.isConnected) {
            Util.vlog(2, `The element with hint ${hint.hint_number} is no longer connected`);
            _remove_hint(hint);
            return;
        }

        if (!hint.displacement) {
            return;
        }

        // It's an overlay hint...

        const hint_number  = hint.hint_number;
        const $element     = $(hinted_element);
        const $inner       = $(hint.hint_tag).children().first();
        const show_at_end  = hint.show_at_end;
        const displacement = hint.displacement;

        if (!$inner[0].isConnected) {
            if (Hints.option("keep_hints")) {
                // some webpages seem to temporarily disconnect then reconnect hints
                return;
            }
            Batcher.mutating(() => {
                Util.vlog(2, `lost hint for ${hint.hint_number}; removing...`);
                // TODO: automatically reconnect at bottom of body? <<<>>>
                // do we need to preserve $outer as well then?
                _remove_hint(hint);
            });
            return;
        }

        const target_box     = $element[0].getBoundingClientRect();
        const inner_box      = $inner[0]  .getBoundingClientRect();
        const element_hidden = (target_box.top == 0 && target_box.left == 0);
        const inner_hidden   = (inner_box .top == 0 && inner_box .left == 0);
        let target_top  = target_box.top;
        let target_left = target_box.left;
        if (show_at_end) {
            target_left += target_box.width - inner_box.width;
        }
        target_top  -= displacement.up;
        target_left += displacement.right;

        if (element_hidden) {
            if (inner_hidden) {
                return;
            }
            Batcher.mutating(() => {
                Util.vlog(3, `hiding hint for hidden element ${hint_number}`);
                $inner.attr("CBV_hidden", "true"); 
            });
            return;
        }
        if (inner_hidden) {
            // TODO: what if hidden attribute already removed?
            const style = $inner[0].style;
            if (style == undefined) return;  // XML case...
            let inner_top  = parseFloat(style.top);
            let inner_left = parseFloat(style.left);
            Batcher.mutating(() => {
                Util.vlog(3, `unhiding hint for unhidden element ${hint_number}`);
                $inner.removeAttr("CBV_hidden"); 
                $inner[0].style.top  = `${inner_top  + target_top  - inner_box.top}px`;
                $inner[0].style.left = `${inner_left + target_left - inner_box.left}px`;
            });
            return;
        }

        if (Math.abs(inner_box.left - target_left) > 0.5 ||
            Math.abs(inner_box.top  - target_top)  > 0.5) {
            const style = $inner[0].style;
            if (style == undefined) return;  // XML case...
            let inner_top  = parseFloat(style.top);
            let inner_left = parseFloat(style.left);
            Batcher.mutating(() => {
                Util.vlog(3, `(re)positioning overlay for ${hint_number}`);
                Util.vlog(3, `  ${inner_box.top} x ${inner_box.left}` + 
                         ` -> ${target_top} x ${target_left}`);

                $inner[0].style.top  = `${inner_top + target_top - inner_box.top}px`;
                $inner[0].style.left = `${inner_left + target_left - inner_box.left}px`;
            });
        }
    }

    function _remove_hint(hint) {
        Batcher.mutating(() => {
            const hinted_element = hint.hinted_element.deref();
            Util.vlog(2, `removing ${hint.hint_number}:`);
            Util.vlog(2, hinted_element);
            $(hint.hint_tag).remove();
            hint_number_to_hint.delete(hint.hint_number);
            hinted_elements.delete(hinted_element);
            if (Hints.option("mark_hinted")) {
                $(`[CBV_hint_number='${hint.hint_number}']`).removeAttr("CBV_hint_number");
            }
            _discard_hint_number(hint.hint_number);
        });
    }


    // precondition: currently in a sensing step
    function adjust_hints() {
        for (const [hint_number, hint] of hint_number_to_hint) {
                adjust_hint(hint);
        }
    }


    Hint = {
        get_hints_made:            get_hints_made,
        get_max_hint_number_used:  get_max_hint_number_used,
        get_hints_in_use:          get_hints_in_use,

        make_hint:                 make_hint,
        initialize_hint:           initialize_hint,

        locate_hint:               locate_hint,
        is_hinted_element:         is_hinted_element,
        discard_hints:             discard_hints,

        dump_hint:                 dump_hint,
        get_hinted_element:        get_hinted_element,
        adjust_hint:               adjust_hint,
        adjust_hints:              adjust_hints
    };
})();
