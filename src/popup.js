import { doUserCommand } from './background-utilities.js';

$(document).ready(function() {
    $(".CBV_popup_form").on("submit", function() {
        var input_text = $("#hint_number").val();
        doUserCommand(input_text, true);
        return false;
    });
});
