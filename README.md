# acm-roster
acm-roster is an npm ([node.js](https://nodejs.org/en/)) package that fetches the roster data of an ACM Student Chapter. This is intended to be used by ACM Student Chapters that need to access their chapter members data for use in their applications. The script provides the member number, first name, last name, e-mail, affiliation, membership type, date added, expiration date, and ACM membership status for all current chapter members.

## What you need to know
1. To log your client in, you need the ACM Administrator Panel **username and password** for your chapter.
2. When logging in to the ACM panel with the client, it is strongly recommended that you **do not enter your username and password as inline plaintext.** An alternative is to use a `.json` or `.env` file to hold your username and password, import the data fields, and add the file to `.gitignore`.
3. You must log in before using the other methods.
4. All package methods are asynchronous and return promises, except the "is" functions (e.g. isOfficer(), isMember(), isActiveMember()).  
5. The login() and reloadMembers() methods take several seconds (5 on average) to execute.

## Installation
Run the command `npm install acm-roster` to add this package to your project.

## Usage
Since the package methods are asynchronous, they must be called within an async function or within a promise. It is important that one method finishes its job before the next method begins. Both techniques are show below:<br><br>

**Using async function**
```js
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
```js
// log in to chapters ACM account
client.login("acm-username", "acm-password")
    .then((res) => {
	client.getAllMembers().then(() => console.log("successful"));
    })
    .catch((err) => console.log(err));
```
Executing your methods within a promise can make your code difficult to read and understand, so it is recommended you only use this method when using an async function is not an option.
## Available Methods
To see more details on the method, such as the return type and input parameters, click the method name or [visit the Wiki](https://github.com/mgrist/acm-roster/wiki).
* [`login`](https://github.com/mgrist/acm-roster/wiki/login()) - Logs your client in to ACM Panel to access your chapters roster data.
* `reloadMembers` - Updates member list with the most recent roster data. Used when changes have been made to the roster and you want to refresh the members.
* `getAllMembers` - Retrieves the entire list of members from your chapter.
* `getMemberByID` - Fetches a members data based on a specific ACM ID.
* `getMemberByEmail` - Searches roster for members with a certain email address.
* `getMembersByFristName` - Retrieves all members with a specific first name.
* `getMembersByLastName` - Retrieves all members with a specific last name.
* `getMembersByAffiliation` - Retrieves all members that belong to a specific affiliation, such as Angelo State University.
* `getMembersByType` - Retrieves all members of a specific type. Types can include Chapter Member, Secretary, Treasurer, Vice Chair, Chair, Faculty Sponsor, or any other chapter roles you may have created.
* `getActiveMembers` - Retrieves all members with an active ACM membership.
* `getInactiveMembers` - Retrieves all members that do not have an active ACM membership.
* `isMember` - Determines if a user is a registered member of your chapter.
* `isActiveMember` - Determines if a user is an active ACM Member.
* `isOfficer` - Determines if a user is an Officer of the Club. Typically, the Club Officers consist of the Secretary, Treasurer, Vice Chair, and Chair. It is possible to add more officer positions through ACM (such as Web Master).


## How it works
1. The script begins by supplying your login credentials to a form, and the form is sent in a post request using x-www-form-urlencoding to the ACM host url. This will log you into the ACM admin panel.

2. Upon successfully logging into the admin panel, a CFID and CFTOKEN are given in the response of the post request, which are required for the roster retrieval API.

3. After parsing the CFID and CFTOKEN from the response, a GET request is then sent to the ACM host to obtain the list of chapter members. The response will return a long CSV string.

4. The CSV string is then parsed into an array of objects, which can be manipulated however you desire. For example, updating a MongoDB database with the most recent roster data.

## Documentation
You can find [the documentation here](https://github.com/mgrist/acm-roster/wiki).

## Contact
[![email-svg](https://img.shields.io/badge/email-matthewgrist0311%40gmail.com-red?style=flat&logo=gmail)](mailto:matthewgrist0311@gmail.com)<br>
Copyright (c) 2022 Matthew Grist
