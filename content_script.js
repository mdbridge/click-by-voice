function add_hints() {
    console.log("adding hints");

    var i = 0;
    $("a[href]").each(function(index) {
	$(this).attr("CBV_hint_number", i);
	$(this).after("<span CBV_hint_tag='" + i + "'></span>");
	i = i + 1;
    });
}

function goto_hint(hint) {
    console.log("goto_hint: " + hint);

    var element = $("[CBV_hint_number='" + hint + "']");
    if (element.length != 0)
	element[0].click();
}


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
	goto_hint(request.hint_number);
    });

$(document).ready(function() {
    add_hints();
});

