///
/// JavaScript to implement popup.html page, which is the pop up for
/// manually entering hints.
///
/// Note that console messages from this code show up in the console
/// for the pop-up widget, not the webpage.  Right click on popup then
/// choose inspect then console.
///

import { do_user_command } from '../background/background_utilities.js';


document.addEventListener('DOMContentLoaded', function() {
    document.querySelector(".CBV_popup_form").addEventListener("submit", async function(event) {
        event.preventDefault();
        const input_text = document.getElementById("hint_number").value;
        await do_user_command(input_text);
        // Closing the pop up window ends its JavaScript execution
        // so need to do it only after above done.
        window.close();
    });
});
