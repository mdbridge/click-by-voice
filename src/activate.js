///
/// Activating a hint by hint descriptor (usually a number)
///
/// Provides Activate

"use strict";

var Activate = null;

(function() {

    //
    // Working with points
    //

    // return position in viewpoint to click on $element
    function point_to_click($element) {
        // If $element takes up multiple boxes, pretend it just is the first box
        const rectangles = $element[0].getClientRects();
        const rectangle  = rectangles[0];

        let x = (rectangle.left + rectangle.right) /2;
        let y = (rectangle.top  + rectangle.bottom)/2;

        // If inside iframes, accumulate offsets up to the top window
        let win = $element[0].ownerDocument.defaultView;
        while (win && win.frameElement) {
            const fr = win.frameElement.getBoundingClientRect();
            x += fr.left;
            y += fr.top;
            win = win.parent;
        }

        return {x: x, y: y};
    }

    // return position in viewpoint of top right point of $element
    function top_right_point($element) {
        // If $element takes up multiple boxes, pretend it just is the first box
        const rectangles = $element[0].getClientRects();
        const rectangle  = rectangles[0];

        let x = rectangle.right;
        let y = rectangle.top;

        // If inside iframes, accumulate offsets up to the top window
        let win = $element[0].ownerDocument.defaultView;
        while (win && win.frameElement) {
            const fr = win.frameElement.getBoundingClientRect();
            x += fr.left;
            y += fr.top;
            win = win.parent;
        }

        return {x: x, y: y};
    }

    // Convert viewpoint point to physical(*) pixel offset relative to
    // inner bottom-left corner of browser Windows client area.
    // 
    // * - at least physical as far as the PC sees; the monitor might
    //     do some stretching after the fact.
    // 
    // This is accurate to within +/- 1 after rounding so long as
    // there isn't any UI stuff like a downloads bar at the bottom or
    // left of the browser.  This also may be inaccurate if the
    // browser window crosses monitors with different DPIs.
    function viewportToBottomLeftPhysicalOffset(clientX, clientY) {
        const stretch = window.devicePixelRatio;  // includes both in-browser zoom and monitor stretch
        const screenX =                       clientX  * stretch;
        const screenY = (window.innerHeight - clientY) * stretch;
        return {x: screenX, y: screenY};
    }

    // Convert viewpoint point to screen coordinates relative to window
    // and place in clipboard
    function output_bottom_left_physical_offset(point) {
        const physicalPixelOffset = viewportToBottomLeftPhysicalOffset(point.x, point.y);
        const answer              = physicalPixelOffset.x + "," + physicalPixelOffset.y;

        Util.vlog(1, "********************************************************************************");
        Util.vlog(1, "input viewport point: " + point.x + " , " + point.y);
        Util.vlog(1, "window.devicePixelRatio: " + window.devicePixelRatio);
        Util.vlog(1, "bottom left physical offset: " +answer);

        act("copy_to_clipboard", {text: answer});
    }


    //
    // 
    //




    // Apply heuristics to determine if an element should be clicked or
    // focused.
    function wants_click($element) {
        if ($element.is("button")) {
            return true;
        } else if ($element.is("a")) {
            return true;
        } else if ($element.is(":input")) {
            if ($element.attr("type") == "submit")
                return true;
            if ($element.attr("type") == "checkbox")
                return true;
            if ($element.attr("type") == "radio")
                return true;
            if ($element.attr("type") == "button")
                return true;
        }
        if ($element.attr("onclick")) {
            return true;
        }
        const role = $element.attr("role");
        switch (role) {
        case "button":
        case "link":
            return true;
            break;
        }

        if (Util.css($element, "cursor") === "pointer")
            return true;

        return false;
    }

    function dispatch_mouse_events($element, event_names) {
        event_names.forEach(function(event_name) {
            const event = document.createEvent('MouseEvents');
            event.initMouseEvent(event_name, true, true, window, 1, 0, 0, 0, 0, 
                                 false, false, false, false, 0, null);
            $element[0].dispatchEvent(event);
        });
    }

    function area($element) {
        try {
            return $element.height() * $element.width();
        } catch (e) {
            return -1;
        }
    }

    function href($element) {
        if ($element.is("iframe, frame"))
            return $element[0].src;
        if ($element.attr("href"))
            return $element[0].href;
        return undefined;
    }



    let last_hover = null;

    function silently_activate($element, hint_if_known, operation) {
        // It is impossible to measure this from inside the browser so
        // we are just assuming it's 1.0, which means that the
        // physical-move-the-mouse commands will only work on monitors
        // with no DPI scaling.
        switch (operation) {
            // Focusing:
        case "f":
            // this also works for [i]frames
            $element[0].focus();
            break;

            // Clicking:
        case "c":
            // quora.com needs the mouseover event for clicking 'comments':
            dispatch_mouse_events($element, ['mouseover', 'mousedown']);
            $element[0].focus();
            // we are not simulating leaving the mouse hovering over the element here <<<>>>
            dispatch_mouse_events($element, ['mouseup', 'click', 'mouseout']);
            break;

            // Following or copying explicit links:
        case "t":
            if (href($element))
                // change focus to new tab
                act("create_tab", {URL: href($element), active: true});
            break;
        case "b":
            if (href($element))
                // do not change focus to new tab
                act("create_tab", {URL: href($element), active: false});
            break;
        case "w":
            if (href($element))
                act("create_window", {URL: href($element)});
            break;
        case "k":
            if (href($element))
                act("copy_to_clipboard", {text: href($element)});
            break;

            // Hovering:
        case "h":
            if (last_hover) {
                dispatch_mouse_events(last_hover, ['mouseout', 'mouseleave']);
            }
            // hover same element means unhover
            if (last_hover==null || last_hover[0] !== $element[0]) {
                dispatch_mouse_events($element, ['mouseover', 'mouseenter']);
                last_hover = $element;
            } else
                last_hover = null;
            break;

            // Copying element text:
        case "s": {
            const clone = $element.clone();
            clone.find("[CBV_hint_element]").remove();
            Util.vlog(1, clone[0]);
            const text = clone[0].textContent;
            Util.vlog(1, '"' + text + '"');
            act("copy_to_clipboard", {text: text});
            break;
        }


            // Debug information:
        case "D": {
            console.log("");
            if (hint_if_known) {
                hint_if_known.dump();
                console.log("");
            }
            console.log("Element information:");
            if (Util.is_in_shadow_root($element[0]))
                console.log("element is in a shadow root.");
            console.log($element[0].getBoundingClientRect());
            console.log($element[0].getClientRects());
            console.log($element[0]);
            console.log(`display: ${Util.css($element, "display")}; ` +
                        `visibility: ${Util.css($element, "visibility")}; ` +
                        `is_under_low_opacity: ${Util.is_under_low_opacity($element[0])}`);
            console.log(`cursor: ${Util.css($element, "cursor")}`);
            break;
        }

            // Moving the physical mouse:
        case "Xnew":
            output_bottom_left_physical_offset(point_to_click($element));
            break;
        case "XnewTL":
            output_bottom_left_physical_offset(top_right_point($element));
            break;


            // experimental:
        case "R":
            dispatch_mouse_events($element, ['mouseover', 'contextmenu']);
            break;

        case ">":
            dispatch_mouse_events($element, ['mouseover', 'mousedown', 'mouseout']);
            break;
        case "<":
            dispatch_mouse_events($element, ['mouseover', 'mouseup', 'click', 'mouseout']);
            break;

        case "K":
            $element[0].remove();
            break;
        case "V":
            $element.css("visibility", "hidden");
            break;
       case "ZAP":
           $element.value = "fill";
           break;




            // old versions for comparison purposes; depreciated
        case "C":
            $element[0].click();
            break;
        case "CC":
            dispatch_mouse_events($element, ['mouseover', 'mousedown', 'mouseup', 
                                            'click']);
            break;
        case "DC":
            if ($element.children().length>0)
                $element = $element.children().first();
            $element[0].click();
            break;

        case "TT":
            $element.attr("tabindex", "0");
            $element.siblings().attr("tabindex", "-1");
            break;

        case "FF":
            $element[0].focusin();
            $element[0].focus();
            break;

        case "INSPECT":
            $('body').click(function (event) {
                console.log(event.originalEvent);
                console.log("window.devicePixelRatio: "           + window.devicePixelRatio);
                console.log("Y: "              + (event.screenY - event.clientY));
                console.log("X: "              + (event.screenX - event.clientX));
                console.log("WY: "             + (event.screenY - window.screenY - event.clientY));
                console.log("WX: "             + (event.screenX - window.screenX - event.clientX));
                console.log("X ratio: "        + (event.clientX / event.screenX));
                console.log("outer height: "           + window.outerHeight);
                console.log("inner height: "           + window.innerHeight);

                // Viewport coordinates (CSS px)
                console.log("Viewport (CSS px): x=" + event.clientX + ", y=" + event.clientY);

                // Same point in device pixels (after page zoom / DPR)
                const zoom = window.devicePixelRatio;
                console.log("Viewport (device px): x=" + Math.round(event.clientX * zoom) 
                            + ", y=" + Math.round(event.clientY * zoom));

                // Optional: normalized within the viewport [0..1]
                console.log("Viewport [0..1]: x=" + (event.clientX / window.innerWidth).toFixed(4) +
                            ", y=" + (event.clientY / window.innerHeight).toFixed(4));

                output_viewport_point({x:0, y:0}, 1, false);

                console.log("measured Delta: " + (event.screenY - window.screenY - event.clientY*zoom));

                const elements = document.elementsFromPoint(event.clientX, event.clientY);
                console.log(elements);
                elements.forEach((element, index) => {
                    if (index <= 10) {
                        console.log(element);
                    }
                });
            });
            break;


        default:
            Util.vlog(0, "unknown activate operation: " + operation);
        }
    }


    function activate($element, hint_if_known, operation) {
        if (operation=="c" && $element.is("div, span")) {
            const $parent = $element;
            let max_area = 0;
            $parent.children().each(function(index) {
                if (//!disabled_or_hidden($(this)) &&  // <<<>>>
                    area($(this)) > max_area) {
                    max_area = area($(this));
                    $element = $(this);
                }
            });
            Util.vlog(1, $parent[1] + " -> " + $element[0]);
        }


        if (!Util.is_in_shadow_root($element[0])) {
            $element.addClass("CBV_highlight_class");

            setTimeout(function() {
                setTimeout(function() {
                    $element.removeClass("CBV_highlight_class");
                    // sometimes elements get cloned so do this globally also...
                    // TODO: do we need to make this work inside of iframes also? <<<>>>
                    $(".CBV_highlight_class").removeClass("CBV_highlight_class");
                }, 500);

                silently_activate($element, hint_if_known, operation);
            }, 250);

        } else if (!$element[0].hasAttribute("style")) {
            // We can't use our content script CSS rule so let's just
            // instead use an inline style attribute temporarily if
            // there is not already one:
            $element[0].setAttribute(
                "style",
                [
                    "background-color: yellow",
                    "outline-style: dashed",
                    "outline-color: red",
                    "outline-width: 3px",
                    "opacity: 1",
                    "visibility: visible"
                ].join("; ")
            );
            setTimeout(function() {
                setTimeout(function() {
                    $element[0].removeAttribute("style");
                }, 500);
                silently_activate($element, hint_if_known, operation);
            }, 250);

        } else {
            // Do no highlighting if the element already has inline
            // styles.  Hopefully this is very rare.
            silently_activate($element, hint_if_known, operation);
        }
    }


    // Locate an element described by a hint descriptor in the page, or in a (nested) iframe.
    // Returns object with optional fields $element, hint_if_known.
    function find_hint_descriptor(hint_descriptor, ...contents) {
        const match = hint_descriptor.match(/^\$\{(.*)\}("(.*)")?$/);
        if (match) {
            // ${CSS selector} or ${CSS selector}"text"
            let $element = $(match[1], ...contents);
            if (match[3]) {
                const target = match[3].toLowerCase();
                $element = $element.filter(function(index, e) {
                    return e.textContent.toLowerCase().includes(target);
                });
            }
            $element = $element.first();
            if ($element.length > 0) {
                return { $element: $element };
            }
        } else {
            // hint_number
            const hint = HintManager.locate_hint(hint_descriptor);
            if (!hint) {
                Util.vlog(0, `The hint ${hint_descriptor} is not currently in use`);
                return {};
            }
            const element = hint.hinted_element;
            if (!element) {
                return {};
            }
            return { $element: $(element), hint_if_known: hint };
        }

        // If the hint_descriptor was not found, search recursively in any iframes.
        const $iframes = $("iframe", ...contents);
        if ($iframes.length > 0) {
            return find_hint_descriptor(hint_descriptor, $iframes.contents());
        }

        return {};
    }

    function goto_hint_descriptor(hint_descriptor, operation) {
        const lookup   = find_hint_descriptor(hint_descriptor);
        const $element = lookup.$element;
        if (!$element) {
            Util.vlog(0, "goto_hint_descriptor: unable to find hint descriptor: " + hint_descriptor);
            return;
        }

        if (operation == "") {
            if (wants_click($element))
                operation = "c";
            else
                operation = "f";
            Util.vlog(1, $element[0]);
            Util.vlog(1, "defaulting to: " + operation);
        }

        activate($element, lookup.hint_if_known, operation);
    }


    Activate = {
        goto_hint_descriptor: goto_hint_descriptor
    };
})();
