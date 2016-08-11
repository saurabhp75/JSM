const express = require('express');
const request = require('request');
const config = require("../config.json");

const router = express.Router();

router.get('/', function(req, res) {
  request.get({
    url: jsdRestApiUrl(`/servicedesk/${config.serviceDesk.id}/requesttype/${config.serviceDesk.requestTypeId}/field`),
    auth: auth()
  }, (err, httpResponse, body) => {
    if (httpResponse.statusCode === 200) {
      const requestTypeFields = JSON.parse(body).requestTypeFields;
      var fields = extractStringFields(requestTypeFields);
      res.render('contact', {fields: fields});
    } else {
      writeError(res, httpResponse, body);
    }
  });

  function extractStringFields(requestTypeFields) {
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

  const customerPayload = getCustomerPayload(formFields);
  request.post({
    url: jsdRestApiUrl("/customer"),
    body: customerPayload,
    json: true,
    headers: {
      "X-ExperimentalApi": true
    },
    auth: auth()
  }, (err, httpResponse, body) => {
    var username;
    if (httpResponse.statusCode === 201) {
      username = body.name;
    } else if (userExists(httpResponse, body)) {
      username = customerPayload.email;
    } else {
      writeError(res, httpResponse, body);
      return;
    }

    createRequest(res, username, formFields);
  });

  function createRequest(username, formFields) {
    const requestPayload = getRequestPayload(username, formFields);
    request.post({
      url: jsdRestApiUrl("/request"),
      body: requestPayload,
      json: true,
      auth: auth()
    }, (res, err, httpResponse, body) => {
      if (httpResponse.statusCode < 200 || httpResponse.statusCode >= 300) {
        writeError(res, httpResponse, body);
        return;
      }
      res.statusCode = 201;
      res.end(body.issueKey);
    });
  }

  function getCustomerPayload(formFields) {
    const email = formFields.email;
    return {
      email: email,
      fullName: email2name(email)
    };
  }

  function userExists(httpResponse, body) {
    return httpResponse.statusCode === 400 && body.errorMessage.indexOf("username already exists") > -1;
  }

  function email2name(email) {
    return email.replace(/@.*/, "");
  }

  function getRequestPayload(username, formFields) {
    const requestFields = fieldsWithoutEmail(formFields);
    return {
      serviceDeskId: config.serviceDesk.id,
      requestTypeId: config.serviceDesk.requestTypeId,
      raiseOnBehalfOf: username,
      requestFieldValues: requestFields
    };
  }

  function fieldsWithoutEmail(fields){
    const clonedFields = clone(fields)
    delete clonedFields.email
    return clonedFields;
  }
});

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function writeError(res, httpResponse, body) {
  console.log("Operation failed");
  res.statusCode = httpResponse.statusCode;
  res.statusMessage = httpResponse.statusMessage;
  res.end(body.errorMessage);
}

function auth() {
  return {
    'user': config.instance.username,
    'pass': config.instance.password
  }
}

function jsdRestApiUrl(suffix) {
  return config.instance.url + "/rest/servicedeskapi" + suffix;
}

module.exports = router;
