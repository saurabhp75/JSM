$(function () {
    $("#contact").click(function () {
        var payload = {};
        $("form input").each(function() {
            payload[this.name] = $(this).val();
        });

        $.ajax("/contact", {
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload)
        }).done(function (issueKey) {
            $(".aui-item").html("<p>Thank you. We will get back to you ASAP. Your issue key is " + issueKey + "</p>")
        }).fail(function (jqXhr) {
            $(".aui-item").html("Failed creating request: " + jqXhr.responseText + " (" + jqXhr.status + " - " + jqXhr.statusText + ")");
        });

        return false;
    });
});