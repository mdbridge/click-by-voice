///
/// TBD
///
/// Provides Hint

let Hint = null;

(function() {

    let hint_number_to_hint = {};

    function make_hint(hint_number, hinted_element) {
        let hint = {
            hint_number: hint_number,
            hinted_element: hinted_element
        };
        hint_number_to_hint[hint_number] = hint;
        // console.log(hint);
    }

    // Dump hint information to console
    function dump_hint(hint) {
        console.log(`Hint information for hint number ${hint.hint_number}:`);
        console.log(hint);
        console.log(hint.hinted_element);
    }

    function locate_hint(hint_number) {
        return hint_number_to_hint[hint_number];
    }

    function discard_hints() {
        hint_number_to_hint = {};
    }


    Hint = {
        make_hint: make_hint,
        dump_hint: dump_hint,
        locate_hint: locate_hint,
        discard_hints: discard_hints
    };
})();
