///
/// TBD
///
/// Provides Hint

let Hint = null;

(function() {

    let hint_number_to_hint = {};
    let hinted_elements     = new WeakSet();


    //
    // Creating hints
    //

    function make_hint(hint_number, hinted_element) {
        let hint = {
            hint_number:    hint_number,
            hinted_element: new WeakRef(hinted_element),
            hint_tag:       undefined
        };

        hint_number_to_hint[hint_number] = hint;
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
        return hint_number_to_hint[hint_number];
    }

    function is_hinted_element(element) {
        return hinted_elements.has(element);
    }

    function discard_hints() {
        hint_number_to_hint = {};
        hinted_elements     = new WeakSet();
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

    function adjust_hint(hint) {
        const hinted_element = hint.hinted_element.deref();
        if (!hinted_element || !hinted_element.isConnected) {
            console.log(`The element with hint ${hint.hint_number} is no longer connected`);
            _remove_hint(hint);
            return;
        }

        if (!hint.displacement) {
            return;
        }
        // It's an overlay hint...
        return;
    }

    function _remove_hint(hint) {
        Batcher.mutating(() => {
            const hinted_element = hint.hinted_element.deref();
            console.log(`removing ${hint.hint_number}:`);
            console.log(hinted_element);
            $(hint.hint_tag).remove();
            delete hint_number_to_hint[hint.hint_number];
            hinted_elements.delete(hinted_element);
            if (Hints.option("mark_hinted")) {
                $(`[CBV_hint_number='${hint.hint_number}']`).removeAttr("CBV_hint_number");
            }
        });
    }


    function adjust_hints() {
        for (const hint_number in hint_number_to_hint) {
            if (hint_number_to_hint.hasOwnProperty(hint_number)) {
                adjust_hint(hint_number_to_hint[hint_number]);
            }
        }
    }


    Hint = {
        make_hint:           make_hint,
        initialize_hint:     initialize_hint,

        locate_hint:         locate_hint,
        is_hinted_element:   is_hinted_element,
        discard_hints:       discard_hints,

        dump_hint:           dump_hint,
        get_hinted_element:  get_hinted_element,
        adjust_hint:         adjust_hint,
        adjust_hints:        adjust_hints
    };
})();
