///
/// Code for figuring out which elements of the webpage should be hinted
///
/// Provides FindHint

let FindHint = null;

(function() {


    // does element occupy enough space to be easily clickable?
    function clickable_space($element) {
        if ($element[0].offsetHeight<8 || $element[0].offsetWidth<8)
            return false;
        return true;
    }


    function fast_hintable($element) {
        if (Hints.option('$'))
            return $element.is(Hints.option_value('$'));

        //
        // Standard clickable or focusable HTML elements
        //
        //   Quora has placeholder links with click handlers so allow a's
        //   w/o hrefs...
        //
        const element_tag = $element[0].nodeName.toLowerCase();
        switch (element_tag) {
            case "a":
            case "button":
            case "select":
            case "textarea":
            case "keygen":
            case "iframe":
            case "frame":
            return true;

            case "input":
            let input_type = $element[0].getAttribute("type");
            if (input_type)
                input_type = input_type.toLowerCase();
            if (input_type != "hidden" 
                // not sure false is actually kosher; spec says otherwise <<<>>>
                && ($element[0].getAttribute("disabled")=="false" 
                    || $element[0].getAttribute("disabled")===null))
                return true;
            break;
        }


        //
        // HTML elements directly made clickable or focusable
        //
        if ($element[0].hasAttribute("onclick")) 
            return true;
        if ($element[0].hasAttribute("tabindex") && $element[0].getAttribute("tabindex") >= 0)
            return true;


        //
        // HTML elements that might be clickable due to event listeners or
        // focusable via tabindex=-1
        //
        if (!Hints.option("A")) {
            const role = $element[0].getAttribute("role");
            switch (role) {
            case "button":
            case "checkbox":
            case "link":
            case "menuitem":
            case "menuitemcheckbox":
            case "menuitemradio":
            case "option":
            case "radio":
            case "slider":
            case "tab":
            case "textbox":
            case "treeitem":
                return true;
            }
        }


        // code for finding clickable elements due to cursor: pointer in
        // post-order traversal of each_hintable


        // hard coding XML file buttons: <<<>>>
        if (/\.xml/i.test(window.location.href)) {
            if ($element.is("span.folder-button.open, span.folder-button.fold"))
                return true;
        }


        if (Hints.option_value("+",0)<2)
            return false;

        //
        // Anything we think likely to be clickable or focusable
        //

        // this is *everything* focusable:
        if ($element[0].hasAttribute("tabindex")) 
            return true;

        if (element_tag == "li") 
            return true;

        // innermost div/span/img's are tempting click targets
        switch (element_tag) {
        case "div": case "span": case "img":
            if (clickable_space($element) && $element.children().length == 0)
                return true;
        }

        return false;

    }

    function hintable($element, styles) {
        // for timing how much hintable costs:
        if (Hints.option("N"))
            return false;

        if (fast_hintable($element)) {
            // don't hint invisible elements (their children may be another matter)
            if (styles.visibility == "hidden" && Hints.option_value("+",0)<2) 
                return false;

            if (Hints.option('^') && $element.is(Hints.option_value('^'))) {
                if (Hints.option('|') && $element.is(Hints.option_value('|'))) {
                    return true;
                }
                return false;
            }
            return true;
        } else {
            if (Hints.option('|') && $element.is(Hints.option_value('|'))) {
                // don't hint invisible elements (their children may be another matter)
                if (styles.visibility == "hidden" && Hints.option_value("+",0)<2) 
                    return false;
                return true;
            }
            return false;
        }
    }

    // Enumerate each element that we should hint:
    function each_hintable(callback) {
        let has_hinted_element = new WeakSet();
        function set_hinted($element) {
            let e = $element[0];
            do {
                has_hinted_element.add(e);
                e = e.parentNode;
            } while (e);
        }
        DomWalk.each_displaying(
            // pre-order traversal:
            function ($element, styles) {
                if (hintable($element, styles)) {
                    set_hinted($element);
                    callback($element);
                }

                // post-order traversal:
            }, function ($element, styles) {
                if (Hints.option('$') && !Hints.option("C"))
                    return;

                const parent = $element[0].parentNode;
                if (Hint.is_hinted_element($element[0]))
                    return;
                if (Hint.is_hinted_element(parent))
                    return;

                if (styles.cursor != "pointer") {
                    return;
                }
                if (styles.visibility == "hidden") {
                    return;  // visibility blocks cursor: pointer
                }
                if (window.getComputedStyle(parent).cursor=="pointer")
                    return;

                if (!clickable_space($element))
                    return;

                if (has_hinted_element.has($element[0]))
                    return;

                if (Hints.option('^') && $element.is(Hints.option_value('^')))
                    return false;

                set_hinted($element);
                if (Hints.option("C"))
                    Hints.with_high_contrast(
                        function () { callback($element); });
                else
                    callback($element);
            },
            Hints.option_value('!') // exclusion
        );
    }


    FindHint = {
        each_hintable: each_hintable
    };
})();
