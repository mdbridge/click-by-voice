///
/// Routines for preserving state across service worker idling.
///
/// No code should access this state except through these routines.
///
/// Exception: per-browser-session options are accessed through option_storage.js.
///

// Service workers lack true persistence:
//     they can be automatically stopped when detected to be idle,
//     followed by automatic restart when needed again.
//
// To cope with this, we use per-browser session storage to hold
// anything that needs to persist when the service worker is idle.


//
// Because accessing storage requires yielding, we introduce an
// exclusion mechanism, in_critical_section, to allow atomic changes.
//

// Promise chain to serialize operations
let _critical_section_chain = Promise.resolve();

// Runs thunk as a background persistence "critical section",
// returning its result asynchronously.
// thunk should not throw, but if it does the exception will be logged and null returned.
async function in_critical_section(thunk) {
    const result_promise = _critical_section_chain.then(thunk);
    _critical_section_chain = result_promise.catch((err) => {
        console.error("CBV: in_critical_section thunk failed:", err);
        return null;
    });
    return _critical_section_chain; // resolves to thunk result or null, never rejects
}


//
// Data: tab_id -> {epoch, data}
//
// Here epoch is generated when you initialize a tab's info and is
// global unique within a browser session.
//

// Requires: inside critical section already
async function generate_next_epoch() {
    const result = await chrome.storage.session.get('next_global_epoch');
    const next_epoch = (result.next_global_epoch || 0);
    await chrome.storage.session.set({ next_global_epoch: next_epoch + 1 });
    return next_epoch;
}


// Returns null if given tab has not yet been initialized in this
// browser session.
export async function get_tab_info(tab_id) {
    return in_critical_section(async () => {
        const key    = `tab_${tab_id}`;
        const result = await chrome.storage.session.get(key);
        return result[key] || null;
    });
}

// Returns new epoch.
export async function initialize_tab_info(tab_id, data) {
    return in_critical_section(async () => {
        const key   = `tab_${tab_id}`;
        const epoch = await generate_next_epoch();
        await chrome.storage.session.set({
            [key]: {
                epoch: epoch,
                data:  data
            }
        });
        return epoch;
    });
}

// Attempts to apply transform to tab info data for given tab ID.
// transform cannot be an asynchronous function.
// Fails if tab is not currently initialized with the given epoch.
// Returns whether or not it succeeded (true means yes).
export async function update_tab_info(tab_id, epoch, transform) {
    return in_critical_section(async () => {
        const key    = `tab_${tab_id}`;
        const result = (await chrome.storage.session.get(key))[key] || null;
        if (!result || result.epoch !== epoch)
            return false;

        let new_data;
        try {
            new_data = transform(result.data);
        } catch (error) {
            console.error("CBV: update_tab_info: transform threw:", error);
            return false;
        }
        await chrome.storage.session.set({
            [key]: {
                epoch: epoch,
                data:  new_data
            }
        });
        return true;
    });
}
