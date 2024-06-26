//
// JavaScript to implement popup.html page, which is the pop up for manually entering hints.
//
// Note that console messages from this code show up in the console
// for the pop-up widget, not the webpage.  Right click on popup then
// choose inspect then console.
//

import { do_user_command } from './background_utilities.js';


$(document).ready(function() {
    $(".CBV_popup_form").on("submit", function() {
        const input_text = $("#hint_number").val();
        // Passing true here causes the asynchronous work of
        // do_user_command to end with closing this pop-up.
        do_user_command(input_text, true);
        return false;
    });
});
