//
// Dispatch according to background_clipboard function desired
//

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.target !== 'background_clipboard_offscreen') {
	return;
    }

    switch (message.type) {
    case 'getClipboard':
    	sendResponse({value: getClipboard()});
	break;
    case 'putClipboard':
	putClipboard(message.value);
	break;
    default:
	console.warn(`Unexpected message type received: '${message.type}'.`);
    }
});



//
// The functions themselves
//

function getClipboard() {
    const pasteTarget = document.querySelector('#text');
    pasteTarget.contentEditable = true;
    pasteTarget.focus();
    document.execCommand("paste");
    var paste = pasteTarget.value;
    return paste;
};

function putClipboard(text) {
    const copyTarget = document.querySelector('#text');
    copyTarget.value = text;
    copyTarget.select();
    document.execCommand("copy");
};
