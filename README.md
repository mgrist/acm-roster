# acm-roster
acm-roster is an npm (node.js) package that fetches the roster data of an ACM Student Chapter. This is intended to be used by ACM Student Chapters that need to access their chapter members data for use in their applications. The script provides the member number, first name, last name, e-mail, affiliation, membership type, date added, expiration date, and ACM membership status for all current chapter members.

## What you need to know
1. To log your client in, you need the ACM Administrator Panel **username and password** for your chapter.
2. When logging in to the ACM panel with the client, it is strongly recommended that you **do not enter your username and password as plaintext.** An alternative is to use a `.json` or `.env` file to hold your username and password, import the data fields, and add the file to `.gitignore`.
3. You must log in before using the other methods.
4. All package methods are asynchronous and return promises, except the "is" functions (e.g. isOfficer(), isMember(), isActiveMember()).  
5. The initial login method takes several seconds (5 on average).

## Installing package
Run the command `npm install acm-roster` to add this package to your project.

## Usage
Since the package methods are asynchronous, they must be called within an async function or within a promise. It is important that one method finishes its job before the next method begins. Both techniques are show below:<br><br>

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
## Available Methods
* `login` (string, string)<br>Version 1.0.0<br>login takes two strings for input, a username and password, in that respective order. Logs your client in to ACM Panel to access your chapters roster data.<br>Returns: Promise, error or success message and status code.

## How it works
1. The script begins by supplying your login credentials to a form, and the form is sent in a post request using x-www-form-urlencoding to the ACM host url. This will log you into the ACM admin panel.

2. Upon successfully logging into the admin panel, a CFID and CFTOKEN are given in the response of the post request, which are required for the roster retrieval API.

3. After parsing the CFID and CFTOKEN from the response, a GET request is then sent to the ACM host to obtain the list of chapter members. The response will return a long CSV string.

4. The CSV string is then parsed into an array of objects, which can be manipulated however you desire. For example, updating a MongoDB database with the most recent roster data.
