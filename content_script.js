function add_hints() {
    console.log("adding hints");

    var i = 0;
    $("a[href]").each(function(index) {
	$(this).attr("CBV_hint_number", i);
	$(this).after("<span CBV_hint_tag='" + i + "'></span>");
	i = i + 1;
    });
}


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
	console.log("got hint number: " + request.hint_number);
    });

$(document).ready(function() {
    add_hints();
});

