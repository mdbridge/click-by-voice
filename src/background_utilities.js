//
// Handling commands by sending the command to the content script of the current active tab.
// Assumes we are either the service worker or the pop-up window's JavaScript.
//

export function do_user_command(command_text, close_window) {
    // optional operation field is :<suffix> at end
    let hint_descriptor = command_text;
    let operation       = "";
    // Allow :'s inside 1 level of balanced {}'s to not count as the before operation separator:
    const match = command_text.match(/^((?:[^:\{]|\{[^\}]*\})*):(.*)$/);
    if (match) {
        hint_descriptor = match[1];
        operation       = match[2];
    }

    // Send hint number and operation to content_script.js for current tab:
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, 
                                {hint_descriptor: hint_descriptor,
                                 operation:       operation});
        if (close_window) {
            // Closing the pop up window ends its JavaScript execution
            // so need to do it only after all done here.
            window.close();
        }
    });
}
