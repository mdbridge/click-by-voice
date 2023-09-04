//
// Routines for accessing the clipboard from the background service worker
//


//
// As of September 2023, manifest version 3 requires a workaround to
// achieve this using an offscreen document.
//

let initialized = false;
async function createOffscreenDocument() {
    if (!initialized) {
	console.log('Creating offscreen document...');
	await chrome.offscreen.createDocument({
	    url: 'background_clipboard_offscreen.html',
	    reasons: [chrome.offscreen.Reason.CLIPBOARD],
	    justification: 'Reading and writing text from/to the clipboard'
	});
	console.log('Done creating offscreen document...');
	initialized = true;
    }   
}


export async function getClipboard() {
    await createOffscreenDocument();
    let response = await chrome.runtime.sendMessage({
	type: 'getClipboard',
	target: 'background_clipboard_offscreen'
    });
    return response.value;
};


export async function putClipboard(text) {
    await createOffscreenDocument();
    await chrome.runtime.sendMessage({
	type: 'putClipboard',
	target: 'background_clipboard_offscreen',
	value: text
    });
};
