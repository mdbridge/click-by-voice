///
/// Routines to store options and per-browser-session changes
///

//
// Our saved options, set via extension options pop-up.
//
// The per-session versions are initialized to these but can vary
// during the session.
//

export async function get_saved_options() {
    return chrome.storage.sync.get({
        startingCommand: ":+",
        config:          "# See https://github.com/mdbridge/click-by-voice/blob/master/doc/config.md"
    });
}

export async function put_saved_options(options) {
    await chrome.storage.sync.set(options);
}


//
// Per-browser-session versions
//

export async function get_per_session_options() {
    const saved_options = await get_saved_options();
    return chrome.storage.session.get(saved_options);
}

export async function put_per_session_options(options) {
    await chrome.storage.session.set(options);
}
