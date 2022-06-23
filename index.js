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

    // returns a promise with a success or error message
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

        const result = new Promise((resolve, reject) => {
            if (this.#loggedIn) {
                resolve("Successfully logged in");
            }
            else if (this.#loadMembers(this.#CFID, this.#CFTOKEN) !== 0) {
                reject("ERROR while loading chapter roster.");
            }
            else {
                reject("ERROR: Invalid login credentials.");
            }

        });

        return result;
    }

    // parses and loads members into memberList variable
    // loads as array of objects
    async #loadMembers(CFID, CFTOKEN) {
        // get request that returns the list of members in the chapter, in a csv format
        await axios
        .get(
            "https://services.acm.org/public/chapters/loadmembers/view_edit.cfm?CFID=" +
                CFID +
                "&CFTOKEN=" +
                CFTOKEN +
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

        // using csv parse library to parse csv string
        // columns: true enables array of objects
        this.#memberList = parse(this.#memberList, { columns: true });

        if (!this.#memberList) {
            //console.error("Error parsing member list");
            return -1;
        }

        return 0;
    }
}

module.exports = Chapter;