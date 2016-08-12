const express = require("express");
const request = require("request");
const config = require("../config.json");

const router = express.Router();

const jsdRequest = request.defaults({
  baseUrl: config.instance.url + "/rest/servicedeskapi",
  auth: {
    user: config.instance.username,
    pass: config.instance.password
  },
  json: true
});

router.get("/", (req, res) => {
  jsdRequest.get(`/servicedesk/${config.serviceDesk.id}/requesttype/${config.serviceDesk.requestTypeId}/field`,
  (err, httpResponse, body) => {
    if (httpResponse.statusCode === 200) {
      const requestTypeFields = body.requestTypeFields;
      const fields = extractFields(requestTypeFields);
      res.render("contact", {fields: fields});
    } else {
      writeError(res, httpResponse, body);
    }
  });

  function extractFields(requestTypeFields) {
    const fields = [];
    requestTypeFields.forEach(field => {
      if (field.jiraSchema.type === "string") {
        fields.push(field);
      } else {
        // TODO: handle cases where field is not a string
      }
    });
    return fields;
  }
});

router.post("/contact", (req, res) => {
  const formFields = req.body;

  jsdRequest.post({
    url: "/customer",
    body: {
      email: formFields.email,
      fullName: formFields.email.replace(/@.*/, "")
    },
    headers: {
      "X-ExperimentalApi": true // At the moment, the Create customer endpoint is experimental
    }
  }, (err, httpResponse, body) => {
    let username;
    if (httpResponse.statusCode === 201) {
      username = body.name;
    } else if (httpResponse.statusCode === 400 && body.errorMessage.indexOf("username already exists") > -1) {
      username = formFields.email;
    } else {
      writeError(res, httpResponse, body);
      return;
    }

    createRequest(res, username, formFields);
  });

  function createRequest(res, username, fields) {
    delete fields.email; // email is not a JIRA field, delete it from fields

    jsdRequest.post({
      url: "/request",
      body: {
        serviceDeskId: config.serviceDesk.id,
        requestTypeId: config.serviceDesk.requestTypeId,
        raiseOnBehalfOf: username,
        requestFieldValues: fields
      }
    }, (err, httpResponse, body) => {
      if (httpResponse.statusCode < 200 || httpResponse.statusCode >= 300) {
        writeError(res, httpResponse, body);
        return;
      }
      res.statusCode = 201;
      res.end(body.issueKey);
    });
  }
});

function writeError(res, httpResponse, body) {
  console.error(`Operation failed with ${httpResponse.statusMessage} (${httpResponse.statusCode})`);
  res.statusCode = httpResponse.statusCode;
  res.statusMessage = httpResponse.statusMessage;
  res.end(body.errorMessage);
}

module.exports = router;
