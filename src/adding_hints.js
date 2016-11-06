///
/// Labeling elements with hint tags
///


var next_CBV_hint      = 0;  // -1 means hints are off

function remove_hints() {
    //console.log("removing hints");

    $("[CBV_hint_number]").removeAttr("CBV_hint_number");
    $("[CBV_hint_tag]").remove();

    next_CBV_hint = -1;
}


function add_hints() {
    console.log("adding hints: " + hinting_parameters 
		+ (target_selector ? "$" + target_selector : ""));
    //console.log("@" + window.location.href);
    var start = performance.now();

    // each_hintable(function(element) {});
    // console.log("just each_hintable time:   " + (performance.now()-start) + " ms");
    // start = performance.now();
    
    if (next_CBV_hint < 0)
	next_CBV_hint = 0;

    var overlays = [];
    each_hintable(function(element) {
	if (element.is("[CBV_hint_number]"))
	    return;
	element.attr("CBV_hint_number", next_CBV_hint);

	var delayed = add_hint(element, next_CBV_hint);
	overlays.push(delayed);

	next_CBV_hint += 1;
    });

    overlays.map(function (o) { if (o) o(); });


    // console.log("total hints assigned: " + next_CBV_hint 
    // 		+ "    (" + overlays.length + " overlays added)");
    // console.log("  " + (performance.now()-start) + " ms");
}


function refresh_hints() {
    //console.log(document.activeElement);
    if (next_CBV_hint >= 0)
	add_hints();
}
