$(document).ready(function() {
    $(".CBV_popup_form").on("submit", function() {
	// send hint number to content_script.js for current tab:
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	    chrome.tabs.sendMessage(tabs[0].id, {hint_number: $("#hint_number").val()});
	});

	return false;
    });
});
