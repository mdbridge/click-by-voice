///
/// JavaScript to implement popup.html page, which is the pop up for
/// manually entering hints.
///
/// Note that console messages from this code show up in the console
/// for the pop-up widget, not the webpage.  Right click on popup then
/// choose inspect then console.
///

import { do_user_command } from '../background_utilities.js';


$(document).ready(function() {
    $(".CBV_popup_form").on("submit", async function() {
        const input_text = $("#hint_number").val();
        await do_user_command(input_text);
        // Closing the pop up window ends its JavaScript execution
        // so need to do it only after above done.
        window.close();
        return false;
    });
});
