chrome.commands.onCommand.addListener(function(command) {
    console.log('Command:', command);

    if (command == "blur") {
	console.log('Bluring...');
	// this doesn't work on chrome://... pages due to permission limitations:
	chrome.tabs.executeScript({
	    code: 'document.activeElement.blur()'
	});
    }
});
