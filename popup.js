$(document).ready(function() {
    $(".CBV_popup_form").on("submit", function() {
	console.log("clicked!");
	console.log($("#hint_number").val());
	return false;
    });
});
