///
/// Overall control code for labeling elements with hint tags
///


var next_CBV_hint = 0;  // -1 means hints are off


function remove_hints() {
    //console.log("removing hints");

    $("[CBV_hint_element]").remove();
    $("[CBV_hint_number]").removeAttr("CBV_hint_number");

    next_CBV_hint = -1;
}


function add_hints() {
    console.log("adding hints: " + hinting_parameters 
		+ (target_selector ? "${"+target_selector+"}" : ""));

    if (next_CBV_hint < 0)
	next_CBV_hint = 0;


    var start = performance.now();
    // FindHint.each_hintable(function(element) {});
    // console.log("  just FindHint.each_hintable time:   " + (performance.now()-start) + " ms");
    // start = performance.now();
    

    var delayed_work = [];
    FindHint.each_hintable(function(element) {
	if (element.is("[CBV_hint_number]"))
	    return;
	element.attr("CBV_hint_number", next_CBV_hint);

	var delayed = add_hint(element, next_CBV_hint);
	if (delayed)
	    delayed_work.push(delayed);

	next_CBV_hint += 1;
    });

    delayed_work.map(function (o) { o(); });


    // console.log("total hints assigned: " + next_CBV_hint 
    // 		+ "    (" + delayed_work.length + " overlays added)");
    // console.log("  " + (performance.now()-start) + " ms");
}


function refresh_hints() {
    if (next_CBV_hint >= 0)
	add_hints();
}
