# acm-fetch
acm-fetch is an npm (node.js) package that fetches the roster data of an ACM Student Chapter. This is intended to be used by ACM Student Chapters that need to access their chapter members data for use in their applications. The script provides the member number, first name, last name, e-mail, affiliation, membership type, date added, expiration date, and ACM membership status for all current chapter members.

## What you will need
The only information you need is the ACM Administrator Panel **username and password** for your chapter.

## Installing package
Run the command `npm install acm-roster` to add this package to your project.

## Usage
The package methods are asynchronous and must be called within an async function or with a promise. It is important that one method finishes its job before the next method begins. Both techniques are show below:<br><br>

**Using async function**
```
const Chapter = require("acm-roster");

async function main() {
	const client = new Chapter();

	// log in to chapters ACM account
	await client.login("acm-username", "acm-password")
		.then((res) => console.log(res))
		.catch((err) => console.log(err));

	// retrives all chapter members
	await client.getAllMembers()
		.then((res) => console.log(res))
		.catch((err) => console.log(err));
}
```

**Using a promise**
```
// log in to chapters ACM account
client.login("acm-username", "acm-password")
	.then((res) => {
		client.getAllMembers().then(() => console.log("successful"));
	})
	.catch((err) => console.log(err));
```
**NOTE:** The initial login method takes a few seconds (5 avg) due to ACM's servers.<br>
## How it works
1. The script begins by supplying your login credentials to a form, and the form is sent in a post request using x-www-form-urlencoding to the ACM host url. This will log you into the ACM admin panel.

2. Upon successfully logging into the admin panel, a CFID and CFTOKEN are given in the response of the post request, which are required for the roster retrieval API.

3. After parsing the CFID and CFTOKEN from the response, a GET request is then sent to the ACM host to obtain the list of chapter members. The response will return a long CSV string.

4. The CSV string is then parsed into an array of objects, which can be manipulated however you desire. For example, updating a MongoDB database with the most recent roster data.
