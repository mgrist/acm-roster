const axios = require("axios");
const { parse }  = require("csv-parse/sync");
const FormData = require("form-data");

let Chapter = class {
    #memberList;
    #loggedIn = false;
    /* the CFID and CFTOKEN are required to use the api call that returns
       all the chapter members. I don't know what they do, but all I know is
       they are required in the URL and they change every time you log in. */
    #CFID = "";;
    #CFTOKEN = "";;

    /****************************************************************************/
    /* login(username, password) method                                         */
    /*                                                                          */
    /* The login method is passed a username and password to log into the ACM   */
    /* Admin Panel, where student chapters usually check their roster and other */
    /* club information.                                                        */
    /*                                                                          */
    /* After logging in, the student roster is preemptively loaded into the     */
    /* memberList variable. This is so that methods can be called without having*/
    /* to first call the loadMembers() method. However, if the user wants to    */
    /* ensure the member list is up-to-date, loadMembers() must be called.      */
    /*                                                                          */
    /* Return Type: promise, error or success message                           */
    /****************************************************************************/
    async login(username, password) {
        // create new form data needed to log into the admin panel
        const form = new FormData();
        form.append("username", username);
        form.append("password", password);

        /* post request sent with the form data to log into admin panel
        if login is successful, extract the needed CFID and CFTOKEN */
        await axios
        .post("https://services.acm.org/public/chapters/login.cfm", form)
        /* a successful login attempt gives the status code 301 (redirect), and
        is therefor sent to the .catch block. */
        .catch((response) => {
            // successfully logged in
            if (response.request.res.statusCode == 300) {
                this.#loggedIn = true;
                let res = response.request._redirectable._options.query;
                this.#CFID = res.slice(5, res.indexOf("&"));
                this.#CFTOKEN = res.slice(res.indexOf("CFTOKEN") + 8);
            }
        });

        // promise checks if logged in and members loaded into variable
        const result = new Promise(async (resolve, reject) => {
            let status = await this.loadMembers()
            if (this.#loggedIn && status === 0) {
                resolve("Successfully logged in");
            }
            else if (status !== 0) {
                reject("ERROR while loading chapter roster.");
            }
            else {
                reject("ERROR: Invalid login credentials.");
            }

        });

        return result;
    }

    /****************************************************************************/
    /* loadMembers() method                                                     */
    /*                                                                          */
    /* The loadMembers() method simply updates the memberList with the most     */
    /* recent roster data. This is to be used when recent changes have been made*/
    /* to the roster, and you want to update the memberList data to ensure it's */
    /* up-to-date.                                                              */
    /*                                                                          */
    /* NOTE: This function takes several (5 avg) seconds to execute due to the  */
    /* load times of ACM servers.                                               */
    /*                                                                          */
    /* Return Type: integer, 0 on success, -1 on failure                        */
    /****************************************************************************/
    async loadMembers() {
        // get request that returns the list of members in the chapter, in a csv format
        await axios
        .get(
            "https://services.acm.org/public/chapters/loadmembers/view_edit.cfm?CFID=" +
                this.#CFID +
                "&CFTOKEN=" +
                this.#CFTOKEN +
                "&mcsv=y&expfilter=x"
        )
        .then((res) => {
            //storing csv data in variable as a string...
            this.#memberList = res.data;
        })
        .catch((err) => {
            //console.error(err);
            return -1;
        });

        // parses and loads members into memberList variables
        // columns: true enables array of objects
        this.#memberList = parse(this.#memberList, { columns: [
            "memberNumber",
            "firstName",
            "lastName",
            "email",
            "affiliation",
            "memberType",
            "dateAdded",
            "expireDate",
            "activeMember"
        ] });

        if (!this.#memberList) {
            //console.error("Error parsing member list");
            return -1;
        }

        return 0;
    }

    /****************************************************************************/
    /* getAllMembers() method                                                   */
    /*                                                                          */
    /* The getAllMembers() method is simply to return the whole list of members */
    /* within the ACM Chapter. Must be logged in before calling this method.    */
    /*                                                                          */
    /* Return Type: promise, array of objects on success, error message on fail */
    /****************************************************************************/
    async getAllMembers() {
        return new Promise((resolve, reject) => {
            if (this.#loggedIn) {
                resolve(this.#memberList);
            }
            else {
                reject("ERROR: You must be logged in to fetch members.");
            }
        });
    }

    /****************************************************************************/
    /* getMemberByID(acmID) method                                              */
    /*                                                                          */
    /* The getMemberByID() method is simply used to fetch a members data based  */
    /* on a specific ACM membership id, which is passed as an argument. Must be */
    /* logged in before calling this method. ID must be a string or integer     */
    /*                                                                          */
    /* Return Type: promise, object with data on success, error message on fail */
    /****************************************************************************/
    async getMemberByID(acmID) {
        return new Promise ((resolve, reject) => {
            if (!this.#loggedIn) {
                reject("ERROR: Must be logged in to fetch member data");
            }
            else if(!acmID) {
                reject("ERROR: Must pass an ID to search for.");
            }
            else if(typeof(acmID) !== "string" && typeof(acmID) !== "number") {
                reject("ERROR: ID must be a number or a string.");
            }
            else {
                resolve(this.#memberList.find((element) => element["memberNumber"] == acmID));
            }
        });
    }

    /****************************************************************************/
    /* getMemberByEmail() method                                                */
    /*                                                                          */
    /* The getMemberByEmail() method is simply used to fetch a members data     */
    /* based on a specific ACM membership id, which is passed as an argument.   */
    /* Must be logged in before calling this method. ID must be a string.       */
    /*                                                                          */
    /* Return Type: promise, object with data on success, error message on fail */
    /****************************************************************************/
    async getMemberByEmail(email) {
        return new Promise ((resolve, reject) => {
            if (!this.#loggedIn) {
                reject("ERROR: Must be logged in to fetch member data");
            }
            else if(!email) {
                reject("ERROR: Must pass an email to search for.");
            }
            else if(typeof(email) !== "string") {
                reject("ERROR: Invalid data type, must pass a string.");
            }
            else {
                resolve(this.#memberList.find((element) => element["email"] == email));
            }
        });
    }

    /****************************************************************************/
    /* getMembersByFirstName(firstName) method                                  */
    /*                                                                          */
    /* The getMembersByFirstName() method retrieves all chapter members with    */
    /* the first name that is specified in the function argument. Must pass a   */
    /* string as an argument and must be logged in.                             */
    /*                                                                          */
    /* Return Type: promise, member obect on success, error message on fail.    */
    /****************************************************************************/
    async getMembersByFirstName(firstName) {
        return new Promise(async (resolve, reject) => {
            if (!this.#loggedIn) {
                reject("ERROR: Must be logged in to fetch member data");
            }
            else if(!firstName) {
                reject("ERROR: Must pass a name to search for.");
            }
            else if(typeof(firstName) !== "string") {
                reject("ERROR: Invalid data type, must pass a string.");
            }
            else {
                let result = [];
                let tempList = this.#memberList;
                // sort list by first names
                await tempList.sort((first, second) => (first["firstName"] > second["firstName"]) ? 1 : -1);
                // find first occurance of name
                let start = tempList.findIndex(element => element["firstName"] === firstName);

                if (start === -1) {
                    reject("ERROR: No members with the first name, \"" + firstName + "\", were found.");
                    return;
                }

                for (let i = start; i < tempList.length && tempList[i].firstName == firstName; i++) {
                    result.push(tempList[i]);
                }

                resolve(result);
            }
        });
    }

}

module.exports = Chapter;