$(function () {
    $("#contact").click(function () {
        var formFields = {};
        $("form input").each(function() {
            formFields[this.name] = $(this).val();
        });

        $("form :input").prop("disabled", true);
        $("button").text("Please wait...");

        $.ajax("/contact", {
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(formFields)
        }).done(function (issueKey) {
            $(".content").html("<p>Thank you. We will get back to you ASAP. Your issue key is " + issueKey + "</p>")
        }).fail(function (jqXhr) {
            $(".content").html("Failed creating request: " + jqXhr.responseText + " (" + jqXhr.status + " - " + jqXhr.statusText + ")");
        });

        return false;
    });
});