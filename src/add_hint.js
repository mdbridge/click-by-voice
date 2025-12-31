///
/// Labeling an element with a hint tag
///
/// Provides AddHint

let AddHint = null;

"use strict";

(function() {


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
        let zindex = Util.css($element, "z-index", 0);
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

    function hints_excluded($element) {
        if (Util.is_in_shadow_root($element[0])) {
            // Don't put hints inside shadow roots because we don't
            // have our CBV CSS rules there.
            return true;
        }
        if ($element[0].shadowRoot) {
            // Don't put hints as children of nodes with open shadow
            // roots as that may result in them not being shown
            // because of lack of slots.
            //
            // There is a similar problem with closed shadow roots,
            // but unfortunately we can't detect those.
            return true;
        }
        if (Hints.option("exclude") && $element.is(Hints.option_value("exclude"))) {
            return true;
        }
        if ($element.is("[contenteditable], [contenteditable] *")) {
            return true;
        }
        return false;
    }

    // Can we legally put a span element inside of element and have it be
    // visible?  Does not take CSS properties into account.
    function can_put_span_inside($element) {
        // unconditionally _empty elements_ that cannot have any child
        // nodes (text or nested elements):
        if ($element.is("area, base, br, col, command, embed, hr, img, input, keygen, link, meta, param, source, track, wbr")) 
            return false;

        if ($element.is("select, option, textarea")) 
            return false;

        if ($element.is("iframe")) 
            // iframe contents are displayed only if browser doesn't support iframe's
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
            const padding = Util.css_pixels($element,"padding-right");
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


    function add_overlay_hint($element, hint) {
        let show_at_end = !Hints.option("s");

        // needs to be before we insert the hint tag <<<>>>
        const displacement = compute_displacement($element);

        //
        // compute where to put overlay
        //
        let $container = $element;
        let inside = false;
        let after = true;

        while ($container && hints_excluded($container)) {
            $container = Util.getVisualParent$Element($container);
        }

        if (! $container || Hints.option("f")) {
            $container = null;
        } else if ($container.is("table, tr, td, th, colgroup, tbody, thead, tfoot")) {
            // temporary kludge for Gmail: <<<>>>
            while ($container && $container.is("table, tr, td, th, colgroup, tbody, thead, tfoot"))
                $container = Util.getVisualParent$Element($container);
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
        if (! $container) {
            $container = $("body, frameset");
            inside = false;
            after = true;
        }

        const zindex = compute_z_index($element);

        Batcher.mutating(() => {
            // console.log("added hint " +  hint.hint_number);
            // console.log($element[0]);

            const $hint_tag = $build_hint(hint.hint_number, true, zindex);
            const $inner    = $hint_tag.children().first();
            insert_element($container, $hint_tag, !after, inside);
            hint.initialize($hint_tag[0]);

            // move overlay into place at end after all inline hints have been
            // inserted so their insertion doesn't mess up the overlay's position:
            hint.displacement = displacement;
            hint.show_at_end  = show_at_end;
            Batcher.sensing(()=>{ hint.adjust(); });
        });
    }



    //
    // 
    //


    function $visual_contents($element) {
        if ($element.is("iframe"))
            return [];

        const indent = Util.css($element, "text-indent");
        if (indent && /^-999/.test(indent))
            return [];
        const font_size = Util.css($element, "font-size");
        if (font_size && /^0[^0-9]/.test(font_size))
            return [];

        return $element.contents().filter(function () {
            if (this.nodeType === Node.COMMENT_NODE)
                return false;

            // ignore nodes intended solely for screen readers and the like
            if (this.nodeType === Node.ELEMENT_NODE) {
                if (Util.css($(this),"display") == "none")
                    return false;
                if (Util.css($(this),"visibility") == "hidden")
                    return false;
                //          if ($(this).width()==0 && $(this).height()==0)
                if (Util.css($(this),"position") == "absolute"
                    || Util.css($(this),"position") == "fixed")
                    return false;
            }

            return true;
        });
    }


    function get_text_overflow_ellipisis_clip($element) {
        while ($element) {
            if (Util.css($element, "text-overflow", "clip") != "clip") {
                let clip = {right: $element[0].getBoundingClientRect().right};

                clip.right  -= Util.css_pixels($element,"border-right-width")
                             - Util.css_pixels($element,"padding-right");
                // We ignore various values like "fit-content" here.
                const slop = Util.css_pixels($element,"max-width",-1,-1) - $element.width();
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
            if (Util.css($element, "display") != "inline")
                return null;
            $element = Util.getVisualParent$Element($element);
        }
        return null;
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

    // Returns false iff unable to safely add hint.
    function add_inline_hint_inside($element, hint) {
        if (hints_excluded($element)) {
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
            if (Util.css($current, "display") == "flex")
                return false;

            let put_before = false;
            if (!Hints.option(".") && ellipsis_clipping_possible($current)) {
                if (!Hints.option(">"))
                    put_before = true;
                else
                    return false;
            }

            Batcher.mutating(() => {
                const $hint_tag = $build_hint(hint.hint_number, false, 0);
                insert_element($current, $hint_tag, put_before, true);
                hint.initialize($hint_tag[0]);
            });
            return true;
        }
    }


    // This is often unsafe; prefer add_inline_hint_inside.
    // Returns false if unable to add hint.
    function add_inline_hint_outside($element, hint) {
        if (hints_excluded($element)) {
            return false;
        }

        Batcher.mutating(() => {
            const $hint_tag = $build_hint(hint.hint_number, false, 0);
            insert_element($element, $hint_tag, false, false);
            hint.initialize($hint_tag[0]);
        });
        return true;
    }



    function add_hint($element) {
        const hint = HintManager.make_hint($element[0]);
        Batcher.sensing(() => {
            if (Hints.option("o")) {
                add_overlay_hint($element, hint);
                return;
            }

            if (Hints.option("h")) {
                if (!add_inline_hint_inside($element, hint)) {
                    // if ($element.is("input[type=checkbox], input[type=radio]")) {
                    //     add_inline_hint_outside($element, hint);
                    //     return null;
                    // }
                    return add_overlay_hint($element, hint);
                }
                return;
            }

            // current fallback is inline
            if (Hints.option("i") || true) {
                if (add_inline_hint_inside($element, hint))
                    return;
                if (add_inline_hint_outside($element, hint))
                    return;
                Util.vlog(4, "skipping adding inline hint because inline location is excluded");
                // This is a bit of a Kluge as we will keep attempting
                // (unsuccessfully) to hint this element.  <<<>>>
                HintManager.discard_uninitialized_hint(hint);
                return;
            }
        });
    }


    AddHint = {
        add_hint: add_hint
    };
})();
