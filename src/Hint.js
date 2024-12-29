///
/// TBD
///
/// Provides Hint

let Hint = null;

(function() {

    let hint_number_to_hint = {};

    function make_hint(hint_number, hinted_element) {
        let hint = {
            hint_number:    hint_number,
            hinted_element: new WeakRef(hinted_element)
        };
        hint_number_to_hint[hint_number] = hint;
    }

    function locate_hint(hint_number) {
        return hint_number_to_hint[hint_number];
    }

    function discard_hints() {
        hint_number_to_hint = {};
    }


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


    Hint = {
        make_hint: make_hint,
        locate_hint: locate_hint,
        discard_hints: discard_hints,

        dump_hint: dump_hint,
        get_hinted_element: get_hinted_element
    };
})();
