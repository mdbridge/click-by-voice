///
/// Labeling an element with a hint tag
///
/// Provides AddHint

let AddHint = null;

(function() {


    // place me <<<>>>
    function CSS_number($element, property_name) {
        const value = css($element, property_name, "none");
        //console.log(property_name + " -> " + value);
        if (value == "none")
            return 0;
        if (/^[0-9]+px$/.test(value))
            return parseFloat(value);
        if (value == "100%")
            return $element.parent().width(); // <<<>>>
        return 0;
    }



    //
    // Framework for alternating sensing and mutating the DOM to avoid
    // extra forced layouts
    //

    let sensing_work        = [];
    let mutating_work       = [];
    let future_sensing_work = [];

    // use these functions to submit work for this or the next cycle
    function sensing(thunk) {
        sensing_work.push(thunk);
    }
    function mutating(thunk) {
        mutating_work.push(thunk);
    }
    function future_sensing(thunk) {
        future_sensing_work.push(thunk);
    }

    // these are separate helping functions so they can be
    // distinguished in stack traces
    function run_sensing_stage(work) {
        const start = performance.now();
        work.map(function (thunk) {
            thunk();
        });
        return time(start);
    }
    function run_mutating_stage(work) {
        const start = performance.now();
        work.map(function (thunk) {
            thunk();
        });
        return time(start);
    }

    // run all work for the current cycle, continuing until no more
    // work submitted for the current cycle
    function do_work() {
        let result = "";
        while (sensing_work.length + mutating_work.length > 0) {
            let work = sensing_work; sensing_work = [];
            result += "; " + run_sensing_stage(work);
            work = mutating_work; mutating_work = [];
            result += "; " + run_mutating_stage(work);
        }
        sensing_work = future_sensing_work;
        future_sensing_work = [];
        return result.substring(2);
    }

    // cancel any submitted or scheduled work
    function clear_work() {
        sensing_work        = [];
        mutating_work       = [];
        future_sensing_work = [];
    }


    //
    // Generic manipulations of DOM elements
    //

    // add CSS declaration '<item>: <value> !important' to element's
    // inline styles;
    // has no effect on XML elements, which ignore inline styles
    function set_important($element, item, value) {
        try {
            // jquery .css(-,-)  does not handle !important correctly:
            $element[0].style.setProperty(item, value, "important");
            //$element[0].style.setProperty(item, value);
        } catch (e) {}  // XML elements throw an exception
    }


    // insert element before/after target or (if put_inside), at the
    // beginning of target's contents or at the end of target's contents
    function insert_element($target, $element, put_before, put_inside) {
        if (put_inside) {
            if (put_before)
                $target.prepend($element);
            else
                $target.append($element);
        } else {
            if (put_before)
                $target.before($element);
            else
                $target.after($element);
        }
    }



    //
    // Building hint tags
    //

    function $build_base_element() {
        const $element = $("<span></span>");
        // mark our inserted elements so we can distinguish them:
        $element.attr("CBV_hint_element", "true");
        return $element;
    }

    function compute_z_index($element) {
        // beat hinted element's z-index by at least one;
        // if we are not in a different stacking context, this should
        // put us on top of it.
        let zindex = css($element, "z-index", 0);
        if (Hints.option("zindex")) {
            const min_zindex = Hints.option_value("zindex");
            if (zindex < min_zindex || zindex == "auto")
                zindex = min_zindex;
        }
        return zindex;
    }

    function $build_hint(hint_number, use_overlay, zindex) {
        const $outer = $build_base_element();
        $outer.attr("CBV_hint_tag", hint_number);

        if (use_overlay) {
            $outer.attr("CBV_outer_overlay", "true");

            const $inner = $build_base_element();
            $outer.append($inner);

            $inner.attr("CBV_inner_overlay2", "true");
            $inner.attr("CBV_hint_tag", hint_number);
            if (Hints.option("c"))
                $inner.attr("CBV_high_contrast", "true");

            // IMPORTANT: need to have top, left set so offset(-[,-])
            //            works correctly on this element:
            set_important($inner, "top",  "0");
            set_important($inner, "left", "0");

            if (zindex > 0)
                set_important($inner, "z-index", zindex+1);

        } else {
            $outer.attr("CBV_outer_inline", "true");
            if (Hints.option("c"))
                $outer.attr("CBV_high_contrast", "true");
        }

        return $outer;
    }



    //
    // Analysis routines
    //

    // Can we legally put a span element inside of element and have it be
    // visible?  Does not take CSS properties into account.
    function can_put_span_inside($element) {
        // unconditionally _empty elements_ that cannot have any child
        // nodes (text or nested elements):
        if ($element.is("area, base, br, col, command, embed, hr, img, input, keygen, link, meta, param, source, track, wbr")) 
            return false;

        if ($element.is("select, option, textarea")) 
            return false;

        if ($element.is("iframe, frame")) 
            // [i]frame contents are displayed only if browser doesn't support iframe's
            return false;

        // only actual webpage elements are fair game:
        if (CBV_inserted_element($element))
            return false;

        if ($element.is("div, span, a, button, li, th, td")) 
            return true;

        // above absolutely correct; below is heuristic:
        try {
            if ($element.contents().length > 0)
                return true;
        } catch (e) {}
        return false;
    }


    // is it okay to put a span before this element?
    function span_before_okay($element) {
        // don't put spans before tr elements (else messes up table
        // formatting as treats span as first column):
        if ($element.is("tr")) 
            return false;

        return true;
    }



    //
    // Adding overlay hints
    //

    function compute_displacement($element) {
        const displacement       = parseInt(Hints.option_value('E', '0'));
        const displacement_right = parseInt(Hints.option_value('displaceX', displacement));
        const displacement_up    = parseInt(Hints.option_value('displaceY', displacement));
        let extra_displacement_right = 0;
        if (Hints.option("?") && $element.is("input")) {
            const padding = CSS_number($element,"padding-right");
            // too large padding mean something's probably being
            // positioned there absolutely so don't put overlay there
            if (padding > 10)
                extra_displacement_right = -padding + 5;
        }

        let use_displacement = false;
        if ($element.is('a, code, b, i, strong, em, abbr, input[type="checkbox"], input[type="radio"]') 
            && $element.children().length == 0) {
            use_displacement = true;
        }
        if (Hints.option('f')) {
            use_displacement = true;
        }
        if (Hints.option('alwaysDisplace')) {
            use_displacement = true;
        }

        if (use_displacement) {
            return {up: displacement_up, right: displacement_right+extra_displacement_right};
        } else {
            return {up: 0, right: extra_displacement_right};
        }
    }


    function overlay_daemon($element, $outer, $inner, hint_number, show_at_end, displacement) {
        const daemon = function() {
            if (!$element[0].isConnected) {
                mutating(() => {
                    // console.log(`disconnecting: ${hint_number}:`);
                    // console.log($element[0]);
                    $outer.remove();
                    $(`[CBV_hint_number='${hint_number}']`).removeAttr("CBV_hint_number");
                });
                return;
            }
            if (!$inner[0].isConnected) {
                if (Hints.option("keep_hints")) {
                    // some webpages seem to temporarily disconnect then reconnect hints
                    future_sensing(daemon);
                    return;
                }
                mutating(() => {
                    console.log(`lost hint for ${hint_number}; removing...`);
                    // TODO: automatically reconnect at bottom of body? <<<>>>
                    // do we need to preserve $outer as well then?
                    $outer.remove();
                    $(`[CBV_hint_number='${hint_number}']`).removeAttr("CBV_hint_number");
                });
                return;
            }
            future_sensing(daemon);

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
                mutating(() => {
                    // console.log(`hiding hint for hidden element ${hint_number}`);
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
                mutating(() => {
                    // console.log(`unhiding hint for unhidden element ${hint_number}`);
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
                mutating(() => {
                    // console.log(`(re)positioning overlay for ${hint_number}`);
                    // console.log(`  ${inner_box.top} x ${inner_box.left}` + 
                    //          ` -> ${target_top} x ${target_left}`);

                    $inner[0].style.top  = `${inner_top + target_top - inner_box.top}px`;
                    $inner[0].style.left = `${inner_left + target_left - inner_box.left}px`;
                });
            }
        };
        return daemon;
    }

    function add_overlay_hint($element, hint_number) {
        let show_at_end = !Hints.option("s");
        // hard coding reddit entire story link: <<<>>>
        if (/\.reddit\.com/.test(window.location.href)) {
            if ($element.is(".thing"))
                show_at_end = false;
        }

        // needs to be before we insert the hint tag <<<>>>
        const displacement = compute_displacement($element);

        //
        // compute where to put overlay
        //
        let $container = $element;
        let inside = false;
        let after = true;

        if (Hints.option("exclude")) {
            while ($container.is(Hints.option_value("exclude"))) {
                $container = container.parent();
            }
        }

        if (Hints.option("f")) {
            $container = $("body");
            inside = false;
            after = true;
        } else if ($container.is("table, tr, td, th, colgroup, tbody, thead, tfoot")) {
            // temporary kludge for Gmail: <<<>>>
            while ($container.is("table, tr, td, th, colgroup, tbody, thead, tfoot"))
                $container = $container.parent();
            inside = false;
            after = false;
        } else {
            //
            // We prefer to put overlays inside the element so they share the
            // element's fate.  If we cannot legally do that, we prefer before
            // the element because after the element has caused the inserted
            // span to wrap to the next line box, adding space.
            //
            if (can_put_span_inside($container)) {
                inside = true;
                after = false;
            } else  {
                inside = false;
                after = !span_before_okay($container);
            }
        }

        const zindex = compute_z_index($element);

        mutating(() => {
            $element.attr("CBV_hint_number", hint_number);
            // console.log("added hint " +  hint_number);
            // console.log($element[0]);

            const $hint_tag = $build_hint(hint_number, true, zindex);
            const $inner    = $hint_tag.children().first();
            insert_element($container, $hint_tag, !after, inside);

            // move overlay into place at end after all inline hints have been
            // inserted so their insertion doesn't mess up the overlay's position:
            const daemon = overlay_daemon($element, $hint_tag, $inner, hint_number, show_at_end, 
                                          displacement);
            sensing(daemon);
        });
    }



    //
    // 
    //


    function $visual_contents($element) {
        if ($element.is("iframe, frame"))
            return [];

        const indent = css($element, "text-indent");
        if (indent && /^-999/.test(indent))
            return [];
        const font_size = css($element, "font-size");
        if (font_size && /^0[^0-9]/.test(font_size))
            return [];

        return $element.contents().filter(function () {
            if (this.nodeType === Node.COMMENT_NODE)
                return false;

            // ignore nodes intended solely for screen readers and the like
            if (this.nodeType === Node.ELEMENT_NODE) {
                if (css($(this),"display") == "none")
                    return false;
                if (css($(this),"visibility") == "hidden")
                    return false;
                //          if ($(this).width()==0 && $(this).height()==0)
                if (css($(this),"position")=="absolute"
                    || css($(this),"position")=="fixed")
                    return false;
            }

            return true;
        });
    }


    function get_text_overflow_ellipisis_clip($element) {
        for (;;) {
            if (css($element, "text-overflow", "clip") != "clip") {
                let clip = {right: $element[0].getBoundingClientRect().right};

                clip.right  -= CSS_number($element,"border-right-width") - 
                    CSS_number($element,"padding-right");
                const slop = CSS_number($element,"max-width") - $element.width();
                if (slop>0)
                    clip.right += slop;
                if (slop>0)
                    clip.top = -slop;
                // if (slop>0)
                //      console.log(clip);
                // console.log($element[0]);
                // console.log($element.css("max-width"));
                // console.log(slop);

                return clip;
            }
            if (css($element, "display") != "inline")
                return null;
            $element = $element.parent();
        }
    }


    function ellipsis_clipping_possible($element) {
        const clip = get_text_overflow_ellipisis_clip($element);
        if (!clip)
            return false;

        // hardwire 40 pixels as the maximum hint tag length for now: <<<>>>
        if ($element[0].getBoundingClientRect().right + 40 < clip.right)
            return false;

        return true;
    }


    //
    // Adding inline hints
    //

    // returns false iff unable to safely add hint
    function add_inline_hint_inside($element, hint_number) {
        if (Hints.option("exclude") && $element.is(Hints.option_value("exclude"))) {
            return false;
        }

        let $current = $element;
        for (;;) {
            if (!can_put_span_inside($current))
                return false;

            const $inside = $visual_contents($current);
            if ($inside.length == 0)
                return false;
            const $last_inside = $inside.last();

            if ($last_inside[0].nodeType == Node.ELEMENT_NODE
                && $last_inside.is("div, span, i, b, strong, em, code, font, abbr")) {
                $current = $last_inside;
                continue;
            }

            if ($last_inside[0].nodeType != Node.TEXT_NODE)
                return false;
            if ($last_inside.text() == " ")  // &nsbp
                // Google docs uses &nsbp; to take up space for visual items
                return false;
            if (css($current, "display") == "flex")
                return false;

            let put_before = false;
            if (!Hints.option(".") && ellipsis_clipping_possible($current)) {
                if (!Hints.option(">"))
                    put_before = true;
                else
                    return false;
            }

            mutating(() => {
                $element.attr("CBV_hint_number", hint_number);
                const $hint_tag = $build_hint(hint_number, false, 0);
                insert_element($current, $hint_tag, put_before, true);
            });
            return true;
        }
    }


    // this is often unsafe; prefer add_inline_hint_inside
    function add_inline_hint_outside($element, hint_number) {
        mutating(() => {
            $element.attr("CBV_hint_number", hint_number);
            const $hint_tag = $build_hint(hint_number, false, 0);
            insert_element($element, $hint_tag, false, false);
        });
    }



    function add_hint($element, hint_number) {
        Hint.make_hint(hint_number, $element[0]);
        sensing(() => {
            if (Hints.option("o")) {
                add_overlay_hint($element, hint_number);
                return;
            }

            if (Hints.option("h")) {
                if (!add_inline_hint_inside($element, hint_number)) {
                    // if ($element.is("input[type=checkbox], input[type=radio]")) {
                    //     add_inline_hint_outside($element, hint_number);
                    //     return null;
                    // }
                    return add_overlay_hint($element, hint_number);
                }
                return;
            }

            // current fallback is inline
            if (Hints.option("i") || true) {
                if (!add_inline_hint_inside($element, hint_number))
                    add_inline_hint_outside($element, hint_number);
                return;
            }
        });
    }


    AddHint = {add_hint: add_hint,
               do_work: do_work,
               clear_work: clear_work
              };
})();
