///
/// TBD
///
/// Provides HintManager

"use strict";

let HintManager = null;

(function() {

    // HintNumberGenerator: responsible for doling out hint numbers
    //                      that are not currently used.
    // 
    // To allow reuse, release hint_numbers when they are no longer in use.
    // We attempt to use the smallest hint numbers possible.
    class HintNumberGenerator {
        #next_hint_number               = 0;
        #hints_made                     = 0;
        #hints_retired                  = 0;
        #max_hint_number_used           = -1;

        #retired_hint_numbers           = [];  // For now, these are all integers.
        #is_retired_hint_numbers_sorted = true;

        generate() {
            this.#hints_made++;
            if (!Hints.option("avoiding_reuse") && this.#retired_hint_numbers.length > 0) {
                if (!this.#is_retired_hint_numbers_sorted) {
                    // Sort on demand so we sort only once per batch of numbers generated.
                    // Sort numerically (default JS sort is lexicographic).
                    this.#retired_hint_numbers.sort((a, b) => a - b);
                    this.#is_retired_hint_numbers_sorted = true;
                }
                const number = this.#retired_hint_numbers.shift();
                Util.vlog(2, `reusing hint number ${number}`);
                return number;
            }

            this.#max_hint_number_used = this.#next_hint_number++;
            return this.#max_hint_number_used;
        }

        release(hint_number) {
            this.#hints_retired++;
            this.#retired_hint_numbers.push(hint_number);
            this.#is_retired_hint_numbers_sorted = false;
        }

        get stats() {
            return {
                hints_made:           this.#hints_made,
                max_hint_number_used: this.#max_hint_number_used,
                hints_in_use:         this.#hints_made - this.#hints_retired
            };
        }
    }


    // forward: function _remove_hint(hint_number, hinted_element)
    var _remove_hint;

    // Hint: 
    // 
    //
    class Hint {
        #hint_number;
        #hinted_element;
        #hint_tag;

        displacement;
        show_at_end;

        constructor(hint_number, hinted_element) {
            this.#hint_number    = hint_number;
            this.#hinted_element = new WeakRef(hinted_element);
        }

        initialize(hint_tag) {
            this.#hint_tag = hint_tag;
        }


        get hint_number() {
            return this.#hint_number;
        }

        // Note that this verbose logs to the console as a side effect.
        get hinted_element() {
            const element = this.#hinted_element.deref();
            if (!element) {
                Util.vlog(0, `The element that had hint ${this.#hint_number} longer exists`);
                return undefined;
            }
            if (!element.isConnected) {
                Util.vlog(0, `The element with hint ${this.#hint_number} is no longer connected`);
                return undefined;
            }
            return element;
        }

        dump() {
            console.log(`Hint information for hint number ${this.#hint_number}:`);
            console.log(this);
            const hinted_element = this.#hinted_element.deref();
            if (hinted_element) {
                console.log(hinted_element);
            } else {
                console.log("hinted element has been garbage collected");
            }
            console.log(this.#hint_tag);
        }


        // precondition: we are in a sensing step
        adjust() {
            const hinted_element = this.#hinted_element.deref();
            if (!hinted_element || !hinted_element.isConnected) {
                Util.vlog(2, `The element with hint ${this.#hint_number} is no longer connected`);
                this.#remove();
                return;
            }

            if (!this.displacement) {
                return;
            }

            // It's an overlay hint...

            const hint_number  = this.#hint_number;
            const $element     = $(hinted_element);
            const $inner       = $(this.#hint_tag).children().first();
            const show_at_end  = this.show_at_end;
            const displacement = this.displacement;

            if (!$inner[0].isConnected) {
                if (Hints.option("keep_hints")) {
                    // some webpages seem to temporarily disconnect then reconnect hints
                    return;
                }
                Batcher.mutating(() => {
                    Util.vlog(2, `lost hint for ${this.#hint_number}; removing...`);
                    // TODO: automatically reconnect at bottom of body? <<<>>>
                    // do we need to preserve $outer as well then?
                    this.#remove();
                });
                return;
            }

            const target_box = $element[0].getBoundingClientRect();
            const inner_box  = $inner[0]  .getBoundingClientRect();


            // Figure out whether the element and/or hint tag are hidden

            const inner_hidden = $inner[0].getClientRects().length === 0;

            let element_hidden = false;

            if ($element[0].getClientRects().length === 0) {
                // Technically does element have no layout boxes?
                // In addition to display: none, this includes
                // disconnected elements, non-rendered DOMs, and the like.
                element_hidden = "display: none";
            }

            // Check for other hiding via CSS.  
            //
            // Don't need to worry about offscreen (the tag moves
            // offscreen as well); under something is handled in next section.
            if (!element_hidden) {
                if (Util.is_under_low_opacity(hinted_element) && Hints.option("hide_opacity")) {
                    element_hidden = "low opacity";
                } else if (Hints.option("hide_visibility") && Util.css($(hinted_element), "visibility") === "hidden") {
                    element_hidden = "visibility: hidden";
                }
            }

            if (Hints.option("hide_seen") && !element_hidden) {
                // transparent padding can pass through clicks
                let test_y = target_box.top + Util.css_pixels($element,"padding-top") + 1;
                test_y = (target_box.top + target_box.bottom)/2;
                let test_x;
                if (show_at_end) {
                    test_x = target_box.right - Util.css_pixels($element,"padding-right") - 1;
                } else {
                    test_x = target_box.left  + Util.css_pixels($element,"padding-left")  + 1;
                }

                // TODO: deal with iframes
                // TODO: consider better test point
                const topmost_element = document.elementFromPoint(test_x, test_y);
                // topmost_element is null if the test point is
                // offscreen, which we don't count as hidden
                if (topmost_element) {
                    if (!$element[0].contains(topmost_element)) {
                        if (true || !topmost_element.contains($element[0])) {
                            // console.log(`hint ${this.#hint_number} not visible: ${test_x},${test_y}`);
                            // console.log(topmost_element);
                            // console.log(topmost_element.getBoundingClientRect());
                            // console.log($element[0]);
                            // console.log($element[0].getBoundingClientRect());
                            // if (topmost_element.contains($element[0])) {
                            //     console.log("fell through?")
                            // }
                            const elements = document.elementsFromPoint(test_x, test_y)
                            elements.forEach((element, index) => {
                                if (index <= 2) {
                                    // console.log(element);
                                }
                            });
                            // console.log(`${target_box.right - target_box.left}x${target_box.bottom - target_box.top}`);
                            element_hidden = "not seen";
                        }
                    }
                }
            }


            if (Hints.option("reverse-hiding")) {
                element_hidden = !element_hidden;
            }

            if (element_hidden) {
                if (inner_hidden) {
                    return;
                }
                Batcher.mutating(() => {
                    Util.vlog(3, `hiding hint for hidden element ${hint_number};` +
                              ` due to ${element_hidden}`);
                    $inner.attr("CBV_hidden", "true"); 
                });
                return;
            }

            let target_top  = target_box.top;
            let target_left = target_box.left;
            if (show_at_end) {
                target_left += target_box.width - inner_box.width;
            }
            target_top  -= displacement.up;
            target_left += displacement.right;
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
                    Util.vlog(4, `(re)positioning overlay for ${hint_number}`);
                    Util.vlog(4, `  ${inner_box.top} x ${inner_box.left}` + 
                              ` -> ${target_top} x ${target_left}`);

                    $inner[0].style.top  = `${inner_top + target_top - inner_box.top}px`;
                    $inner[0].style.left = `${inner_left + target_left - inner_box.left}px`;
                });
            }
        }

        #remove() {
            Batcher.mutating(() => {
                $(this.#hint_tag).remove();
                const hinted_element = this.#hinted_element.deref();
                _remove_hint(this.#hint_number, hinted_element);
            });
        }
    }



    //
    // Keeping track of hints
    //
    
    let hint_number_generator = new HintNumberGenerator();
    let hint_number_to_hint   = new Map();
    let hinted_elements       = new WeakSet();


    function make_hint(hinted_element) {
        const hint_number = hint_number_generator.generate();
        let   hint        = new Hint(hint_number, hinted_element);

        hint_number_to_hint.set(hint_number, hint);
        hinted_elements.add(hinted_element);

        if (Hints.option("mark_hinted")) {
            // Optionally for debugging mark the hinted element in the DOM.
            $(hinted_element).attr("CBV_hint_number", hint_number);
        }

        return hint;
    }

    function discard_uninitialized_hint(hint) {
        const hint_number    = hint.hint_number;
        const hinted_element = hint.hinted_element;
        hinted_elements.delete(hinted_element);
        hint_number_to_hint.delete(hint_number);
        if (Hints.option("mark_hinted")) {
            $(`[CBV_hint_number='${hint_number}']`).removeAttr("CBV_hint_number");
        }
        hint_number_generator.release(hint_number);
    }

    // precondition: call this during a mutating step
    var _remove_hint = function _remove_hint(hint_number, hinted_element) {
        Util.vlog(2, `removing ${hint_number}:`);
        Util.vlog(2, hinted_element);
        hinted_elements.delete(hinted_element);
        hint_number_to_hint.delete(hint_number);
        if (Hints.option("mark_hinted")) {
            $(`[CBV_hint_number='${hint_number}']`).removeAttr("CBV_hint_number");
        }
        hint_number_generator.release(hint_number);
    }


    function locate_hint(hint_number) {
        return hint_number_to_hint.get(Number(hint_number));
    }

    function is_hinted_element(element) {
        return hinted_elements.has(element);
    }

    function discard_hints() {
        hint_number_generator = new HintNumberGenerator();
        hint_number_to_hint.clear();
        hinted_elements = new WeakSet();
        _remove_hint_numbers_from(document);
    }

    function _remove_hint_numbers_from(from) {
        // This doesn't search open shadow roots, but that's okay for
        // now because this is a debug feature.  <<<>>>
        $("[CBV_hint_number]", from).removeAttr("CBV_hint_number");
        const $iframe = $("iframe", from);
        if ($iframe.length != 0) {
            _remove_hint_numbers_from($iframe.contents());
        }
    }



    //
    // Inspecting hint numbers
    //

    function get_hint_number_stats() {
        return hint_number_generator.stats;
    }


    //
    // Operations on hints
    //
    
    // precondition: currently in a sensing step
    function adjust_hints() {
        for (const [hint_number, hint] of hint_number_to_hint) {
                hint.adjust();
        }
    }


    HintManager = {
        get_hint_number_stats:      get_hint_number_stats,

        make_hint:                  make_hint,
        discard_uninitialized_hint: discard_uninitialized_hint,
        locate_hint:                locate_hint,
        is_hinted_element:          is_hinted_element,
        discard_hints:              discard_hints,

        adjust_hints:               adjust_hints
    };
})();
