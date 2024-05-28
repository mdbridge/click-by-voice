///
/// Code for walking the DOM, skipping undesirable elements
///
/// Provides DomWalk

let DomWalk = null;

(function() {

    function each_displaying_helper(element, pre_callback, post_callback, exclusion) {
        if (CBV_inserted_element(element))
            return;

        const styles = window.getComputedStyle(element[0]);
        if (styles.display == "none") {
            return;
        }

        if (exclusion && element.is(exclusion))
            return;

        if (pre_callback)
            pre_callback(element, styles);

        element.children().each(function(index) {
            each_displaying_helper($(this), pre_callback, post_callback, exclusion);
        });

        const element_tag = element[0].nodeName.toLowerCase();
        if (element_tag == "iframe" || element_tag == "frame") {
            try {
                // var sub_body = $('body', element.contents());
                // each_displaying_helper(sub_body, pre_callback, post_callback);

                // some popover ads are after <body> element
                $("html", element.contents()).children().filter(":not(head)").each(function (index) {
                    each_displaying_helper($(this), pre_callback, post_callback, exclusion);
                });
            } catch (e) {
                console.log("[i]frame access failure: " + e);
            }
        }

        if (post_callback)
            post_callback(element, styles);
    }


    // Enumerate each webpage element that is displayed (that is, has
    // a display property other than none *and* all its parents have
    // display properties other than none).  If exclusion is defined,
    // elements matching it are treated similar to elements with a
    // display property of none.
    //
    // pre_callback is the preorder traversal, post_callback the
    // post-order traversal
    function each_displaying(pre_callback, post_callback, exclusion) {
        // var root = $("body");
        // each_displaying_helper(root, pre_callback, post_callback);

        // some popover ads are after <body> element
        $("html").children().filter(":not(head)").each(function (index) {
            each_displaying_helper($(this), pre_callback, post_callback, exclusion);
        });
    }


    DomWalk = {each_displaying: each_displaying};
})();
