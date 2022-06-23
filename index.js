const axios = require("axios");
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
            else {
                reject("ERROR: Invalid login credentials.");
            }
        });

        return result;
    }
}

module.exports = Chapter;