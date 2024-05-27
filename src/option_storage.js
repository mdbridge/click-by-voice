//
// Routines to store options and per-session changes
//

//
// Our saved options, set via extension options pop-up.
//
// The per-session versions are initialized to these but can vary
// during the session.
//

export async function getSavedOptions() {
    return await chrome.storage.sync.get({
        startingCommand: ":+",
        config:          ""
    });
}

export async function putSavedOptions(options) {
    await chrome.storage.sync.set(options);
}


//
// Per-session versions
//

export async function getPerSessionOptions() {
    const saved_options = await getSavedOptions();
    return await chrome.storage.session.get(saved_options);
}

export async function putPerSessionOptions(options) {
    await chrome.storage.session.set(options);
}
