$(document).ready(function() {
    $(".CBV_popup_form").on("submit", function() {
	var input_text = $("#hint_number").val();

	// optional operation field is :<suffix> at end
	var hint_number = input_text;
	var operation	= "";
	var match = input_text.match(/^([^:]*):(.*)$/);
	if (match) {
	    hint_number = match[1];
	    operation	= match[2];
	}

	// send hint number and operation to content_script.js for current tab:
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	    // chrome.tabs.update(tabs[0].id, {selected: true});
	    // chrome.tabs.update(tabs[0].id, {highlighted: true});
	    // chrome.tabs.update(tabs[0].id, {active: true});
	    chrome.tabs.sendMessage(tabs[0].id, 
				    {hint_number: hint_number,
				     operation:   operation});
	    window.close();
	});

	return false;
    });
});
