const axios = require("axios");
const { parse } = require("csv-parse/sync");
const FormData = require("form-data");
const crypto = require("crypto");

let Chapter = class {
  #memberList = [];
  #acmSubList = [];
  #activeList = [];
  #inactiveList = [];

  // username and password are both encrypted when stored.
  // not sure of a better way to do this :|
  #username = "";
  #password = "";

  #loggedIn = false;

  /* the CFID and CFTOKEN are required to use the api call that returns
       all the chapter members. I don't know what they do, but all I know is
       they are required in the URL and they change every time you log in. */
  #CFID = "";
  #CFTOKEN = "";

  #initVector = "";
  #secretKey = "";
  #algorithm = "aes-256-cbc";

  #encrypt(message) {
    if (this.#initVector === "" && this.#secretKey === "") {
      // generate 16 bytes of random data
      this.#initVector = crypto.randomBytes(16);
      // secret key generate 32 bytes of random data
      this.#secretKey = crypto.randomBytes(32);
    }

    // the cipher function
    const cipher = crypto.createCipheriv(this.#algorithm, this.#secretKey, this.#initVector);
    let encryptedData = cipher.update(message, "utf-8", "hex");
    encryptedData += cipher.final("hex");

    return encryptedData;
  }

  #decrypt(encryptedMessage) {
    // the decipher function
    const decipher = crypto.createDecipheriv(
      this.#algorithm,
      this.#secretKey,
      this.#initVector
    );
    let decryptedData = decipher.update(encryptedMessage, "hex", "utf-8");
    decryptedData += decipher.final("utf8");

    return decryptedData;
  }

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

    this.#username = this.#encrypt(username);
    this.#password = this.#encrypt(password);

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

    if (!this.#loggedIn) {
      throw new Error("Login attempt unsuccessful, check login credentials.");
    }

    return this.reloadMembers().promise();
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
    if (!this.#loggedIn) {
      throw new Error("ERROR: Must be logged in to load members.");
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
        this.#acmSubList = [];
        this.#activeList = [];
        this.#inactiveList = [];
      })
      .catch((err) => {
        try {
          this.#loggedIn = false;
          return this.login(
            this.#decrypt(this.#username),
            this.#decrypt(this.#password)
          );
        } catch (e) {
          throw err;
        }
      })
      .finally(() => {
        // parses and loads members into memberList variables
        // columns property enables array of objects
        this.#memberList = parse(this.#memberList, {
          columns: [
            "memberNumber",
            "firstName",
            "lastName",
            "email",
            "affiliation",
            "memberType",
            "dateAdded",
            "expireDate",
            "activeMember"
          ]
        });

        if (!this.#memberList) {
          throw new Error("ERROR parsing member list.");
        }

        // removing first object because it contains column headers
        this.#memberList.splice(0, 1);

        return this.#memberList;
      });
  }

  /**
   * Retrieves all members within your student chapter.
   * @returns {object[]} Array of member object(s)
   */
  async getAllMembers() {
    return new Promise((resolve, reject) => {
      if (this.#loggedIn) {
        resolve(this.#memberList);
      } else {
        reject("ERROR: You must be logged in to fetch members.");
      }
    });
  }

  /**
   * Retrieves member information with a specified ACM ID.
   * @param {string|number} acmID ACM member ID to search for.
   * @returns {object} Member object
   */
  async getMemberByID(acmID) {
    return new Promise((resolve, reject) => {
      if (!this.#loggedIn) {
        reject("ERROR: Must be logged in to fetch member data");
      } else if (!acmID) {
        reject("ERROR: Must pass an ID to search for.");
      } else if (typeof acmID !== "string" && typeof acmID !== "number") {
        reject("ERROR: ID must be a number or a string.");
      } else {
        resolve(
          this.#memberList.find((element) => element["memberNumber"] == acmID)
        );
      }
    });
  }

  /**
   * Retrieves member information associated with a specified email address.
   * @param {string} email Email address to search for as a string
   * @returns {object} Member object
   */
  getMemberByEmail(email) {
    return new Promise((resolve, reject) => {
      if (!this.#loggedIn) {
        reject("ERROR: Must be logged in to fetch member data");
      } else if (!email) {
        reject("ERROR: Must pass an email to search for.");
      } else if (typeof email !== "string") {
        reject("ERROR: Invalid data type, must pass a string.");
      } else {
        resolve(this.#memberList.find((element) => element["email"] == email));
      }
    });
  }

  /**
   * Retrieves all members with a specified first name.
   * @param {string} firstName First name to search for as a string
   * @returns {object[]} Array of member object(s)
   */
  getMembersByFirstName(firstName) {
    return new Promise((resolve, reject) => {
      if (!this.#loggedIn) {
        reject("ERROR: Must be logged in to fetch member data");
      } else if (!firstName) {
        reject("ERROR: Must pass a name to search for.");
      } else if (typeof firstName !== "string") {
        reject("ERROR: Invalid data type, must pass a string.");
      } else {
        firstName[0] = firstName[0].toUpperCase();
        let result = this.#memberList.filter(
          (member) => member.firstName === firstName
        );

        resolve(result);
      }
    });
  }

  /**
   * Retrieves all members with a specified last name.
   * @param {string} lastName Last name to search for as a string
   * @returns {object[]} Array of member object(s)
   */
  getMembersByLastName(lastName) {
    return new Promise((resolve, reject) => {
      if (!this.#loggedIn) {
        reject("ERROR: Must be logged in to fetch member data");
      } else if (!lastName) {
        reject("ERROR: Must pass a name to search for.");
      } else if (typeof lastName !== "string") {
        reject("ERROR: Invalid data type, must pass a string.");
      } else {
        lastName[0] = lastName[0].toUpperCase();
        let result = this.#memberList.filter(
          (member) => member.lastName === lastName
        );

        resolve(result);
      }
    });
  }

  /**
   * Retrieves all members by a specific membership type.
   * @param {string} memberType Member type as string. E.g, Chapter Member, Chair,
   *  Vice Chair, Treasurer, Secretary, Faculty Sponsor.
   * @returns {object[]} Array of member object(s)
   */
  getMembersByType(memberType) {
    return new Promise((resolve, reject) => {
      if (!this.#loggedIn) {
        reject("ERROR: Must be logged in to fetch member data");
      } else if (!memberType) {
        reject("ERROR: Must pass an member type to search for.");
      } else if (typeof memberType !== "string") {
        reject("ERROR: Invalid data type, must pass a string.");
      } else {
        let result = this.#memberList.filter(
          (member) => member.memberType === memberType
        );

        resolve(result);
      }
    });
  }

  /**
   * Retrieves all members with an ACM subscription.
   * @returns {object[]} Array of member object(s)
   */
  getSubscribers() {
    return new Promise((resolve, reject) => {
      if (!this.#loggedIn) {
        reject("ERROR: Must be logged in to fetch member data");
      } else if (this.#acmSubList.length > 0) {
        resolve(this.#acmSubList.length);
      } else {
        this.#acmSubList = this.#memberList.filter(
          (member) => member.activeMember === "Yes"
        );

        resolve(this.#acmSubList);
      }
    });
  }

  /**
   * Retrieves all members not subscibed to ACM.
   * @returns {object[]} Array of member object(s)
   */
  getNonSubscibers() {
    return new Promise((resolve, reject) => {
      if (!this.#loggedIn) {
        reject("ERROR: Must be logged in to fetch member data");
      } else {
        let result = this.#memberList.filter(
          (member) => member.activeMember === "No"
        );

        resolve(result);
      }
    });
  }

  /**
   * Retrieves current, nonexpired members.
   * @returns {object[]} Array of member object(s)
   */
  getCurrentMembers() {
    return new Promise((resolve, reject) => {
      if (!this.#loggedIn) {
        reject("ERROR: Must be logged in to fetch member data");
      } else if (this.#activeList.length > 0) {
        return this.#activeList;
      } else {
        const present = new Date().toLocaleDateString("sv");
        this.#activeList = this.#memberList.filter(
          (member) => member.expireDate > present
        );

        resolve(this.#activeList);
      }
    });
  }

  /**
   * Retrieves inactive, expired members.
   * @returns {object[]} Array of member object(s)
   */
  getExpiredMembers() {
    return new Promise((resolve, reject) => {
      if (!this.#loggedIn) {
        reject("ERROR: Must be logged in to fetch member data");
      } else if (this.#inactiveList.length > 0) {
        return this.#inactiveList;
      } else {
        const present = new Date().toLocaleDateString("sv");
        this.#inactiveList = this.#memberList.filter(
          (member) => member.expireDate <= present
        );

        if (this.#inactiveList.length === 0) {
          reject("ERROR: No expired members were found.");
          return;
        }

        resolve(this.#inactiveList);
      }
    });
  }

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

    let result = this.#memberList.find(
      (element) => element["memberNumber"] == id
    );

    return result ? true : false;
  }

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

    let result = this.#memberList.find(
      (element) => element["memberNumber"] == id
    );

    if (result && result.activeMember === "Yes") {
      return true;
    } else {
      return false;
    }
  }

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

    let result = this.#memberList.find(
      (element) => element["memberNumber"] == id
    );

    if (
      result &&
      result.memberType !== "Chapter Member" &&
      result.memberType !== "Faculty Sponsor"
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Returns the total number of chapter members.
   * @returns {number} number
   */
  chapterSize() {
    return this.#memberList.length;
  }

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
    } else {
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
    } else {
      const present = new Date().toLocaleDateString("sv");
      var count = 0;
      for (let member of this.#memberList) {
        if (member.expireDate < present) {
          this.#inactiveList.push(member);
          count++;
        } else {
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
    } else {
      const present = new Date().toLocaleDateString("sv");
      var count = 0;
      for (let member of this.#memberList) {
        if (member.expireDate >= present) {
          this.#activeList.push(member);
          count++;
        } else {
          this.#inactiveList.push(member);
        }
      }
      return count;
    }
  }
};

module.exports = Chapter;
