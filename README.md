# acm-roster
acm-roster is an npm ([node.js](https://nodejs.org/en/)) package that fetches the roster data of an ACM Student Chapter. This is intended to be used by ACM Student Chapters that need to access their chapter members data for use in their applications. The script provides the member number, first name, last name, e-mail, affiliation, membership type, date added, expiration date, and ACM membership status for all current chapter members.

Typescript declarations are not yet included.

Dependencies:
* axios
* csv-parse

## What you need to know
1. To log your client in, you need the ACM Administrator Panel **username and password** for your chapter.
2. You MUST log in before using any other methods.
3. When logging in to the ACM panel with the client, it is strongly recommended that you **do not enter your username and password as inline plaintext.** An alternative is to use a `.json` or `.env` file to hold your username and password, import the data fields, and add the file to `.gitignore`.  
4. The login() and refreshRoster() methods are asynchronous take several seconds (5 on average) to execute.

## Installation
Run the command `npm install acm-roster` to add this package to your project.

## Usage
Since the package methods are asynchronous, they must be called within an async function or within a promise. It is important that the login method finishes its job before the next method begins. Both techniques are show below:<br><br>

**Within an async function:**
```js
const Chapter = require("acm-roster");

async function main() {
    // creating new client
    const client = new Chapter();
    try {
      // log in to chapters ACM account
      await client.login("acm-username", "acm-password");

      // retrives Treasurer member data
      const treasurer = client.getMembersByType("Treasurer");
      console.log(`${treasurer.firstName} ${treasurer.lastName} is the clubs Treasurer.`);
    } catch (err) {
      throw err;
    }
}
```

**Within a promise:**
```js
const Chapter = require("acm-roster");

// creating new client
const client = new Chapter();

// log in to chapters ACM account with client
client.login("acm-username", "acm-password").then((res) => {
    // initial login method returns full member list
    console.log(res);
	
    // get all members with active membership
    const activeMembers = client.getCurrentMembers();
    console.log(activeMembers);
});
```
## Available Methods
To see more details on the method, such as the return type and input parameters, click the method name or [visit the Wiki](https://github.com/mgrist/acm-roster/wiki).
* [`login`](https://github.com/mgrist/acm-roster/wiki/login) - Logs your client into ACM Panel to access your chapter roster data.
* [`refreshRoster`](https://github.com/mgrist/acm-roster/wiki/refreshRoster) - Updates member list with the most recent roster data. Used when changes have been made to the roster and you want to refresh the members.
* [`getAllMembers`](https://github.com/mgrist/acm-roster/wiki/getAllMembers) - Retrieves the entire list of members from your chapter.
* [`getMemberByID`](https://github.com/mgrist/acm-roster/wiki/getMemberById) - Fetches a members data based on a specific ACM ID.
* [`getMemberByEmail`](https://github.com/mgrist/acm-roster/wiki/getMemberByEmail) - Searches roster for members with a certain email address.
* [`getMembersByFirstName`](https://github.com/mgrist/acm-roster/wiki/getMembersByFirstName) - Retrieves all members with a specific first name.
* [`getMembersByLastName`](https://github.com/mgrist/acm-roster/wiki/getMembersByLastName) - Retrieves all members with a specific last name.
* [`getMembersByType`](https://github.com/mgrist/acm-roster/wiki/getMembersByType) - Retrieves all members of a specific type. Types can include Chapter Member, Secretary, Treasurer, Vice Chair, Chair, Faculty Sponsor, or any other chapter roles you may have created.
* [`getSubscribers`](https://github.com/mgrist/acm-roster/wiki/getSubscribers) - Retrieves all members with an ACM Subscription.
* [`getNonSubscribers`](https://github.com/mgrist/acm-roster/wiki/getNonSubscribers) - Retrieves all members that do not have an active ACM subscription.
* [`getCurrentMembers`]() - Retrieves active members of the club, that are non-expired.
* [`getExpiredMembers`]() - Retrieves inactive members of the club, that are expired.
* [`isMember`]() - Determines if a user is a registered member of your chapter.
* [`isActiveMember`]() - Determines if a user is an active ACM Member.
* [`isOfficer`]() - Determines if a user is an Officer of the Club. Typically, the Club Officers consist of the Secretary, Treasurer, Vice Chair, and Chair. It is possible to add more officer positions through ACM (such as Web Master).


## How it works
1. The script begins by supplying your login credentials to a x-www-form-urlencoded, and the form is sent in a post request to the ACM host url. This will log you into the ACM admin panel.

2. Upon successfully logging into the admin panel, a CFID and CFTOKEN are given in the response of the post request, which are required for the roster retrieval API.

3. After parsing the CFID and CFTOKEN from the response, a GET request is then sent to the ACM host to obtain the list of chapter members. The response will return a long CSV string.

4. The CSV string is then parsed into an array of objects, which can be manipulated however you desire. For example, updating a MongoDB database with the most recent roster data.

## Documentation
You can find [the documentation here](https://github.com/mgrist/acm-roster/wiki).

## Contact
[![email-svg](https://img.shields.io/badge/email-matthewgrist0311%40gmail.com-red?style=flat&logo=gmail)](mailto:matthewgrist0311@gmail.com)<br>
