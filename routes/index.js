const express = require('express');
const request = require('request');
const config = require("../config.json");

const router = express.Router();

const jsdRequest = request.defaults({
  baseUrl: config.instance.url + "/rest/servicedeskapi",
  auth: {
    'user': config.instance.username,
    'pass': config.instance.password
  },
  json: true
});

router.get('/', (req, res) => {
  jsdRequest.get(`/servicedesk/${config.serviceDesk.id}/requesttype/${config.serviceDesk.requestTypeId}/field`,
  (err, httpResponse, body) => {
    if (httpResponse.statusCode === 200) {
      const requestTypeFields = body.requestTypeFields;
      const fields = extractStringFields(requestTypeFields);
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
  jsdRequest.post({
    url: "/customer",
    body: customerPayload,
    headers: {
      "X-ExperimentalApi": true
    }
  }, (err, httpResponse, body) => {
    let username;
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

  function createRequest(res, username, formFields) {
    const requestPayload = getRequestPayload(username, formFields);
    jsdRequest.post({
      url: "/request",
      body: requestPayload
    }, (err, httpResponse, body) => {
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
    const clonedFields = clone(fields);
    delete clonedFields.email;
    return clonedFields;
  }
});

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function writeError(res, httpResponse, body) {
  console.error(`Operation failed with ${httpResponse.statusMessage} (${httpResponse.statusCode})`);
  res.statusCode = httpResponse.statusCode;
  res.statusMessage = httpResponse.statusMessage;
  res.end(body.errorMessage);
}

module.exports = router;
