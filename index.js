const axios = require("axios");
const { parse }  = require("csv-parse/sync");
const FormData = require("form-data");

let Chapter = class {
    #memberList = [];
    #acmSubList = [];
    #activeList = [];
    #inactiveList = [];

    #loggedIn = false;

    /* the CFID and CFTOKEN are required to use the api call that returns
       all the chapter members. I don't know what they do, but all I know is
       they are required in the URL and they change every time you log in. */
    #CFID = "";
    #CFTOKEN = "";

    /****************************************************************************/
    /* login(username, password) method                                         */
    /*                                                                          */
    /* The login method is passed a username and password to log into the ACM   */
    /* Admin Panel, where student chapters usually check their roster and other */
    /* club information.                                                        */
    /*                                                                          */
    /* After logging in, the student roster is preemptively loaded into the     */
    /* memberList variable. This is so that methods can be called without having*/
    /* to first call the reloadMembers() method. However, if the user wants to  */
    /* ensure the member list is up-to-date, reloadMembers() must be called.    */
    /*                                                                          */
    /* Return Type: promise, error message or updated member list               */
    /****************************************************************************/
    /**
     * Log client into the ACM panel to access the student chapter roster.
     * @param {string} username ACM panel username
     * @param {string} password ACM panel password
     * @returns {string} Success or error message
     */
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
        return new Promise((resolve, reject) => {
            if (!this.#loggedIn) {
                throw new Error("Login attempt unsuccessful, check login credentials.");
            }

            this.reloadMembers()
                .then(() => resolve("Successfully logged in."))
                .catch(() => reject("ERROR while loading chapter roster."));
        });
    }

    /****************************************************************************/
    /* reloadMembers() method                                                   */
    /*                                                                          */
    /* The reloadMembers() method updates the memberList with the most recent   */
    /* roster data. This is to be used when recent changes have been made       */
    /* to the roster and you want to update the memberList data to ensure it's  */
    /* up-to-date.                                                              */
    /*                                                                          */
    /* NOTE: This function takes several (5 on avg) seconds to execute due to   */
    /* the load times of ACM servers.                                           */
    /*                                                                          */
    /* Return Type: prmoise, message on fail, updated member list on success.   */
    /****************************************************************************/
    /**
     * Refreshes the chapter roster with most recent data.
     * @returns {object[]} Updated member list as an array of object(s).
     */
    async reloadMembers() {
        return new Promise((resolve, reject) => {
            if (!this.#loggedIn) {
                reject("ERROR: Must be logged in to load members.");
                return;
            }

            // get request that returns the list of members in the chapter, in a csv format
            axios
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
                reject(err);
                return;
            })
            .finally(() => {
                // parses and loads members into memberList variables
                // columns property enables array of objects
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
                    reject("ERROR parsing member list.");
                    return;
                }

                // removing first object because it only contains column names
                this.#memberList.splice(0, 1);

                resolve(this.#memberList);
            });

        });
    }

    /****************************************************************************/
    /* getAllMembers() method                                                   */
    /*                                                                          */
    /* The getAllMembers() method is to return the whole list of members        */
    /* within the ACM Chapter. Must be logged in before calling this method.    */
    /*                                                                          */
    /* Return Type: promise, array of objects on success, error message on fail */
    /****************************************************************************/
    /**
     * Retrieves all members within your student chapter.
     * @returns {object[]} Array of member object(s)
     */
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
    /* The getMemberByID() method is used to fetch a members data based         */
    /* on a specific ACM membership id, which is passed as an argument. Must be */
    /* logged in before calling this method. ID must be a string or integer     */
    /*                                                                          */
    /* Return Type: promise, object with data on success, error message on fail */
    /****************************************************************************/
    /**
     * Retrieves member information with a specified ACM ID.
     * @param {string|number} acmID ACM member ID to search for.
     * @returns {object} Member object
     */
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
    /* The getMemberByEmail() method is used to fetch a members data            */
    /* based on a specific ACM membership id, which is passed as an argument.   */
    /* Must be logged in before calling this method. ID must be a string.       */
    /*                                                                          */
    /* Return Type: promise, object with data on success, error message on fail */
    /****************************************************************************/
    /**
     * Retrieves member information associated with a specified email address.
     * @param {string} email Email address to search for as a string
     * @returns {object} Member object
     */
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
    /**
     * Retrieves all members with a specified first name.
     * @param {string} firstName First name to search for as a string
     * @returns {object[]} Array of member object(s)
     */
    async getMembersByFirstName(firstName) {
        return new Promise((resolve, reject) => {
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
                let result = this.#memberList.filter(member => member.firstName === firstName);

                if (result.length === 0) {
                    reject("ERROR: No members with the first name, \"" + firstName + "\", were found.");
                    return;
                }

                resolve(result);
            }
        });
    }

    /****************************************************************************/
    /* getMembersByLastName(lastName) method                                    */
    /*                                                                          */
    /* The getMembersByLastName() method retrieves all chapter members with     */
    /* the last name that is specified in the function argument. Must pass a    */
    /* string as an argument and must be logged in.                             */
    /*                                                                          */
    /* Return Type: promise, member obect on success, error message on fail.    */
    /****************************************************************************/
    /**
     * Retrieves all members with a specified last name.
     * @param {string} lastName Last name to search for as a string
     * @returns {object[]} Array of member object(s)
     */
    async getMembersByLastName(lastName) {
        return new Promise((resolve, reject) => {
            if (!this.#loggedIn) {
                reject("ERROR: Must be logged in to fetch member data");
            }
            else if(!lastName) {
                reject("ERROR: Must pass a name to search for.");
            }
            else if(typeof(lastName) !== "string") {
                reject("ERROR: Invalid data type, must pass a string.");
            }
            else {
                let result = this.#memberList.filter(member => member.lastName === lastName);

                if (result.length === 0) {
                    reject("ERROR: No members with the last name, \"" + lastName + "\", were found.");
                    return;
                }

                resolve(result);
            }
        });
    }

    /****************************************************************************/
    /* getMembersByType(memberType) method                                      */
    /*                                                                          */
    /* The getMembersByType() method retrieves all chapter members with         */
    /* the member type that is specified in the function argument. Must pass a  */
    /* string as an argument and must be logged in. E.g Chapter Member, Vice    */
    /* Chair, Treasurer, etc.                                                   */
    /*                                                                          */
    /* Return Type: promise, member obect on success, error message on fail.    */
    /****************************************************************************/
    /**
     * Retrieves all members by a specific membership type.
     * @param {string} memberType Member type as string. E.g, Chapter Member, Chair,
     *  Vice Chair, Treasurer, Secretary, Faculty Sponsor.
     * @returns {object[]} Array of member object(s)
     */
    async getMembersByType(memberType) {
        return new Promise((resolve, reject) => {
            if (!this.#loggedIn) {
                reject("ERROR: Must be logged in to fetch member data");
            }
            else if(!memberType) {
                reject("ERROR: Must pass an member type to search for.");
            }
            else if(typeof(memberType) !== "string") {
                reject("ERROR: Invalid data type, must pass a string.");
            }
            else {
                let result = this.#memberList.filter(member => member.memberType === memberType);

                if (result.length === 0) {
                    reject("ERROR: No members with the member type, \"" + memberType + "\", were found.");
                    return;
                }

                resolve(result);
            }
        });
    }

    /****************************************************************************/
    /* getSubscribers() method                                                  */
    /*                                                                          */
    /* getSubscribers() retrievs all active ACM members within your chapter.    */
    /*                                                                          */
    /*Return Type: promise, member object(s) on success, error message on fail  */
    /****************************************************************************/
    /**
     * Retrieves all members with an ACM subscription.
     * @returns {object[]} Array of member object(s)
     */
    async getSubscribers() {
        return new Promise((resolve, reject) => {
            if (!this.#loggedIn) {
                reject("ERROR: Must be logged in to fetch member data");
            }
            else if (this.#acmSubList.length > 0) {
                resolve(this.#acmSubList.length);
            }
            else {
                this.#acmSubList = this.#memberList.filter(member => member.activeMember === "Yes");

                if (this.#acmSubList.length === 0) {
                    reject("ERROR: No active members were found. \u2639");
                    return;
                }

                resolve(this.#acmSubList);
            }
        });
    }

    /****************************************************************************/
    /* getNonSubscribers() method                                               */
    /*                                                                          */
    /* getNonSubscribers() retrievs all inactive ACM members in your chapter.   */
    /*                                                                          */
    /*Return Type: promise, member object(s) on success, error message on fail  */
    /****************************************************************************/
    /**
     * Retrieves all members not subscibed to ACM.
     * @returns {object[]} Array of member object(s)
     */
    async getNonSubscibers() {
        return new Promise((resolve, reject) => {
            if (!this.#loggedIn) {
                reject("ERROR: Must be logged in to fetch member data");
            }
            else {
                let result = this.#memberList.filter(member => member.activeMember === "No");

                if (result.length === 0) {
                    reject("ERROR: No inactive members were found. \u2639");
                    return;
                }

                resolve(result);
            }
        });
    }

    /****************************************************************************/
    /* getCurrentMembers() method                                               */
    /*                                                                          */
    /* getCurrentMembers() retrievs active chapter members that are not expired.*/
    /*                                                                          */
    /*Return Type: promise, member object(s) on success, error message on fail  */
    /****************************************************************************/
    /**
     * Retrieves current, nonexpired members.
     * @returns {object[]} Array of member object(s)
     */
     async getCurrentMembers() {
        return new Promise((resolve, reject) => {
            if (!this.#loggedIn) {
                reject("ERROR: Must be logged in to fetch member data");
            }
            else if (this.#activeList.length > 0) {
                return this.#activeList;
            }
            else {
                const present = new Date().toLocaleDateString('sv');
                this.#activeList = this.#memberList.filter(member => member.expireDate > present);

                if (this.#activeList.length === 0) {
                    reject("ERROR: No current members were found. \u2639");
                    return;
                }

                resolve(this.#activeList);
            }
        });
    }

    /****************************************************************************/
    /* getExpiredMembers() method                                               */
    /*                                                                          */
    /* getExpiredMembers() retrievs inactive chapter members that are expired.  */
    /*                                                                          */
    /*Return Type: promise, member object(s) on success, error message on fail  */
    /****************************************************************************/
    /**
     * Retrieves inactive, expired members.
     * @returns {object[]} Array of member object(s)
     */
     async getExpiredMembers() {
        return new Promise((resolve, reject) => {
            if (!this.#loggedIn) {
                reject("ERROR: Must be logged in to fetch member data");
            }
            else if (this.#inactiveList.length > 0) {
                return this.#inactiveList;
            }
            else {
                const present = new Date().toLocaleDateString('sv');
                this.#inactiveList = this.#memberList.filter(member => member.expireDate <= present);

                if (this.#inactiveList.length === 0) {
                    reject("ERROR: No expired members were found.");
                    return;
                }

                resolve(this.#inactiveList);
            }
        });
    }

    /****************************************************************************/
    /* isMember(id) method                                                      */
    /*                                                                          */
    /* Determines if the supplied member is a registered member of your chapter.*/
    /* Must be passed an ACM id as a number or string or a member object.       */
    /*                                                                          */
    /* Return Type: Boolean, true if they are a member, false otherwise         */
    /****************************************************************************/
    /**
     * Determines if a member is registered with your chapter.
     * @param {(string|number|object)} id A member object or an ACM ID as string/number
     * @returns {boolean} Boolean
     */
    isMember(id) {
        if (!id) return false;
        else if (typeof id === "object") {
            if (id == null) return false;
			id = id.memberNumber;
		}

        let result = this.#memberList.find(element => element["memberNumber"] == id);

        if (result) {
            return true;
        }
        else {
            return false;
        }
    }

    /****************************************************************************/
    /* isActiveMember(id) method                                                */
    /*                                                                          */
    /* Determines if the supplied member is a registered member of your chapter */
    /* and has an active ACM membership.                                        */
    /* Must pass an ACM id as a number or string or a member object.            */
    /*                                                                          */
    /* Return Type: Boolean, true if they are a member, false otherwise         */
    /****************************************************************************/
    /**
     * Determines if a member has an active ACM subscription.
     * @param {(string|number|object)} id A member object or an ACM ID as string/number
     * @returns {boolean} Boolean
     */
    isActiveMember(id) {
        if (!id) return false;
        else if (typeof id === "object") {
            if (id == null) return false;
			id = id.memberNumber;
		}

        let result = this.#memberList.find(element => element["memberNumber"] == id);

        if (result && result.activeMember === "Yes") {
            return true;
        }
        else {
            return false;
        }
    }

    /****************************************************************************/
    /* isOfficer(id) method                                                     */
    /*                                                                          */
    /* Determines if the supplied member is an officer of your chapter.         */
    /* Must pass an ACM id as a number or string or a member object.            */
    /*                                                                          */
    /* Return Type: Boolean, true if they are a member, false otherwise         */
    /****************************************************************************/
    /**
     * Determines if member is an officer of the chapter.
     * @param {(string|number|object)} id A member object or an ACM ID as string/number
     * @returns {boolean} Boolean
     */
    isOfficer(id) {
        if (typeof id === "object") {
            if (id == null) return false;
			id = id.memberNumber;
		}

        let result = this.#memberList.find(element => element["memberNumber"] == id);

        if (result && result.memberType !== "Chapter Member" && result.memberType !== "Faculty Sponsor") {
            return true;
        }
        else {
            return false;
        }
    }

    /****************************************************************************/
    /* chapterSize() method                                                     */
    /*                                                                          */
    /* gets the total number of members in the ACM Chapter.                     */
    /*                                                                          */
    /* Return Type: number                                                      */
    /****************************************************************************/
    /**
     * Returns the total number of chapter members.
     * @returns {number} number
     */
    chapterSize() {
        return this.#memberList.length;
    }

    /****************************************************************************/
    /* acmSubSize() method                                                      */
    /*                                                                          */
    /* gets the number of chapter members that are ACM subscribers, the ones    */
    /* that pay 20$ a year.                                                     */
    /*                                                                          */
    /* Return Type: number                                                      */
    /****************************************************************************/
    /**
     * Returns the number of chapter members suscribed to ACM.
     * @returns {number} number
     */
    acmSubSize() {
        // if acm subscriber list hasn't been generated already
        if (this.#acmSubList.length === 0) {
            // populate the acm subscriber list
            var count = 0;
            for (let member of this.#memberList) {
                if (member.activeMember === "Yes") {
                    this.#acmSubList.push(member);
                    count++;
                }
            }

            return count;
        }
        else {
            return this.#acmSubList.length;
        }
    }

    /**
     * Returns the number of inactive/expired chapter members.
     * @returns {number} number
     */
    inactiveSize() {
        if (this.#inactiveList.length > 0) {
            return this.#inactiveList.length;
        }
        else {
            const present = new Date().toLocaleDateString('sv');
            var count = 0;
            for (let member of this.#memberList) {
                if (member.expireDate < present) {
                    this.#inactiveList.push(member);
                    count++;
                }
                else {
                    this.#activeList.push(member);
                }
            }
            return count;
        }
    }

    /**
     * Returns the number of active/non-expired chapter members.
     * @returns {number} number
     */
    activeSize() {
        if (this.#activeList.length > 0) {
            return this.#activeList.length;
        }
        else {
            const present = new Date().toLocaleDateString('sv');
            var count = 0;
            for (let member of this.#memberList) {
                if (member.expireDate >= present) {
                    this.#activeList.push(member);
                    count++;
                }
                else {
                    this.#inactiveList.push(member);
                }
            }
            return count;
        }
    }
}

module.exports = Chapter;