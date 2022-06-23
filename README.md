# acm-fetch
acm-fetch is an npm (node.js) package that fetches the roster data of an ACM Student Chapter. This is intended to be used by ACM Student Chapters that need to access their chapter members data for use in their applications. The script provides the member number, first name, last name, e-mail, affiliation, membership type, date added, expiration date, and ACM membership status for all current chapter members.

## What you will need
The only information you need is the **username and password** that is used to login to the ACM Administrator Panel for your chapter.

## Installing package
Run the command `npm install acm-roster` to add this package to your project.

## Usage
```
const Chapter = require("acm-roster");

```

## How it works
1. The script begins by supplying your login credentials to a form, and the form is sent in a post request using x-www-form-urlencoding to the ACM host url. This will log you into the ACM admin panel.

2. Upon successfully logging into the admin panel, a CFID and CFTOKEN are given in the response of the post request, which are required for the roster retrieval API.

3. After parsing the CFID and CFTOKEN from the response, a GET request is then sent to the ACM host to obtain the list of chapter members. The response will return a long CSV string.

4. The CSV string is then parsed into an array of objects, which can be manipulated however you desire. For example, updating a MongoDB database with the most recent roster data.
