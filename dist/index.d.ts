export = Chapter;
declare class Chapter {
    /****************************************************************************/
    /****************************************************************************/
    /**
     * Log client into the ACM panel to access the student chapter roster.
     * @param {string} username ACM panel username
     * @param {string} password ACM panel password
     * @returns {Promise<object[] | string>} Member list or error message
     */
    login(username: string, password: string): Promise<object[] | string>;
    /****************************************************************************/
    /****************************************************************************/
    /**
     * Refreshes the chapter roster with most recent data.
     * @returns {Promise<object[] | string>} Updated member list as an array of object(s) or error.
     */
    refreshRoster(): Promise<object[] | string>;
    /**
     * Retrieves all members within your student chapter.
     * @returns {object[]} Array of member object(s)
     */
    getAllMembers(): object[];
    /**
     * Retrieves member information with a specified ACM ID.
     * @param {string | number} acmID ACM member ID to search for.
     * @returns {object | undefined} Member object
     */
    getMemberByID(acmID: string | number): object | undefined;
    /**
     * Retrieves member information associated with a specified email address.
     * @param {string} email Email address to search for as a string
     * @returns {object | undefined} Member object
     */
    getMemberByEmail(email: string): object | undefined;
    /**
     * Retrieves all members with a specified first name.
     * @param {string} firstName First name to search for as a string
     * @returns {object[]} Array of member object(s)
     */
    getMembersByFirstName(firstName: string): object[];
    /**
     * Retrieves all members with a specified last name.
     * @param {string} lastName Last name to search for as a string
     * @returns {object[]} Array of member object(s)
     */
    getMembersByLastName(lastName: string): object[];
    /**
     * Retrieves all members by a specific membership type.
     * @param {string} memberType Member type as string. E.g, Chapter Member, Chair,
     *  Vice Chair, Treasurer, Secretary, Faculty Sponsor.
     * @returns {object[]} Array of member object(s)
     */
    getMembersByType(memberType: string): object[];
    /**
     * Retrieves all members with an ACM subscription.
     * @returns {object[]} Array of member object(s)
     */
    getSubscribers(): object[];
    /**
     * Retrieves all members not subscibed to ACM.
     * @returns {object[]} Array of member object(s)
     */
    getNonSubscibers(): object[];
    /**
     * Retrieves current, nonexpired members.
     * @returns {object[]} Array of member object(s)
     */
    getCurrentMembers(): object[];
    /**
     * Retrieves inactive, expired members.
     * @returns {object[]} Array of member object(s)
     */
    getExpiredMembers(): object[];
    /**
     * Determines if a member is registered with your chapter.
     * @param {(string|number|object)} id A member object or an ACM ID as string/number
     * @returns {boolean} Boolean
     */
    isMember(id: (string | number | object)): boolean;
    /**
     * Determines if a member has an active ACM subscription.
     * @param {(string|number|object)} id A member object or an ACM ID as string/number
     * @returns {boolean} Boolean
     */
    isActiveMember(id: (string | number | object)): boolean;
    /**
     * Determines if member is an officer of the chapter.
     * @param {(string|number|object)} id A member object or an ACM ID as string/number
     * @returns {boolean} Boolean
     */
    isOfficer(id: (string | number | object)): boolean;
    /**
     * Returns the total number of chapter members.
     * @returns {number} number
     */
    chapterSize(): number;
    /**
     * Returns the number of chapter members subscribed to ACM.
     * @returns {number} number
     */
    acmSubSize(): number;
    /**
     * Returns the number of inactive/expired chapter members.
     * @returns {number} number
     */
    inactiveSize(): number;
    /**
     * Returns the number of active/non-expired chapter members.
     * @returns {number} number
     */
    activeSize(): number;
    #private;
}
//# sourceMappingURL=index.d.ts.map