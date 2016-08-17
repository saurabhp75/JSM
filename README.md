# JIRA Service Desk Branded Customer Portal example

This is an Atlassian Connect add-on which listens to a Twitter stream and 
creates Service Desk requests from them.

Read the tutorial here: [Guide - Creating your own branded customer portal](https://developer.atlassian.com/jiracloud/guide-creating-your-own-branded-customer-portal-41224344.html)

## How to run this

1. Ensure that you have the following:
	* A running node.js environment (v5.10.0 or later)	
	* A development instance of JIRA Service Desk (if you need one, get one [here](http://go.atlassian.com/cloud-dev)) 
2. Copy `config.json.sample` to `config.json` and fill in the `"instance"` and `"serviceDesk"` sections
3. Run `npm install`
4. Run `node app.js`
