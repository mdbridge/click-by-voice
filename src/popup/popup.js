///
/// JavaScript to implement popup.html page, which is the pop up for
/// manually entering hints.
///
/// Note that console messages from this code show up in the console
/// for the pop-up widget, not the webpage.  Right click on popup then
/// choose inspect then console.
///

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("CBV_popup_form").addEventListener("submit", async function(event) {
        event.preventDefault();
        const input_text = document.getElementById("hint_number").value;
        // Ask the service worker to run the command rather than
        // running it ourselves so that session storage only ever has
        // a single writer (otherwise its critical sections, which are
        // per JavaScript context, cannot prevent races).
        await chrome.runtime.sendMessage({ action: "pop_up_user_command", text: input_text });
        // Close only once the service worker has received the
        // command; if it could not be reached (a rejection here), we
        // deliberately stay open so the user can retry by pressing
        // enter again.
        window.close();
    });
});
