var next_CBV_hint = 0;

function add_hints() {
    console.log("adding hints");

    $("a[href]").each(function(index) {
	$(this).attr("CBV_hint_number", next_CBV_hint);
	$(this).after("<span CBV_hint_tag='" + next_CBV_hint + "'></span>");
	next_CBV_hint = next_CBV_hint + 1;
    });
}

function refresh_hints() {
    console.log("refreshing hints");

    $("a[href]").each(function(index) {
	if ($(this).is("[CBV_hint_number]"))
	    return;

	$(this).attr("CBV_hint_number", next_CBV_hint);
	$(this).after("<span CBV_hint_tag='" + next_CBV_hint + "'></span>");
	next_CBV_hint = next_CBV_hint + 1;
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
//    setTimeout(function() { refresh_hints(); }, 150);
    setTimeout(function() { refresh_hints(); }, 5000);
});

