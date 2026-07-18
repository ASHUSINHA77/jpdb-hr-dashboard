/**
 * HR Dashboard - JsonPowerDB Helper Module
 * Provides low-level AJAX wrappers for JPDB API operations.
 * Uses native XMLHttpRequest for maximum compatibility (no jQuery required).
 */

const JPDBHelper = (function() {
    'use strict';

    /**
     * Build the full API URL for IRL operations.
     * @returns {string} Full JPDB API base URL
     */
    function getBaseUrl() {
        return APP_CONFIG.jpdb.baseUrl + APP_CONFIG.jpdb.irl;
    }

    /**
     * Build the full API URL for IML operations.
     * @returns {string} Full JPDB IML URL
     */
    function getImlUrl() {
        return APP_CONFIG.jpdb.baseUrl + APP_CONFIG.jpdb.iml;
    }

    /**
     * Create a standard JPDB token string from the config.
     * Format: token
     * @returns {string} Token string
     */
    function createTokenString() {
        return APP_CONFIG.db.token;
    }

    /**
     * Create the JPDB JSON request payload for IRL operations.
     * @param {string} cmd - JPDB command (PUT, GET, UPDATE, REMOVE, etc.)
     * @param {string} recordId - The record key value
     * @param {Object|null} data - Record data (for PUT/UPDATE), null for read/delete ops
     * @returns {Object} JPDB request payload
     */
    function createIrlPayload(cmd, recordId, data) {
        const payload = {
            token: createTokenString(),
            cmd: cmd,
            dbName: APP_CONFIG.db.dbName,
            rel: APP_CONFIG.db.relationName
        };

        // For operations requiring a record ID
        if (recordId !== null && recordId !== undefined) {
            payload.jsonStr = JSON.stringify({
                [APP_CONFIG.primaryKey]: recordId
            });
        }

        // For PUT and UPDATE, include the full data
        if (data !== null && data !== undefined) {
            payload.jsonStr = JSON.stringify(data);
        }

        return payload;
    }

    /**
     * Perform an AJAX call to JPDB using XMLHttpRequest.
     * @param {string} method - HTTP method (POST)
     * @param {string} url - Full API endpoint URL
     * @param {Object} payload - Request body payload
     * @returns {Promise<Object>} Resolves with parsed response, rejects on error
     */
    function ajaxRequest(method, url, payload) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.open(method, url, true);
            xhr.setRequestHeader("Content-Type", "application/json");

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve({
                            status: xhr.status,
                            statusText: xhr.statusText,
                            data: response
                        });
                    } catch (e) {
                        reject({
                            status: xhr.status,
                            statusText: xhr.statusText,
                            rawResponse: xhr.responseText,
                            error: "Failed to parse JSON response"
                        });
                    }
                }
            };

            xhr.onerror = function() {
                reject({
                    status: 0,
                    statusText: "Network Error",
                    error: "Unable to connect to JsonPowerDB server"
                });
            };

            xhr.ontimeout = function() {
                reject({
                    status: 0,
                    statusText: "Timeout",
                    error: "Request timed out"
                });
            };

            xhr.timeout = 15000; // 15 second timeout
            xhr.send(JSON.stringify(payload));
        });
    }

    /**
     * Perform an AJAX call to JPDB IML endpoint.
     * @param {Object} imlPayload - The IML command object
     * @returns {Promise<Object>} Resolves with parsed response
     */
    function ajaxImlRequest(imlPayload) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const url = getImlUrl();

            xhr.open("POST", url, true);
            xhr.setRequestHeader("Content-Type", "application/json");

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve({
                            status: xhr.status,
                            statusText: xhr.statusText,
                            data: response
                        });
                    } catch (e) {
                        reject({
                            status: xhr.status,
                            statusText: xhr.statusText,
                            rawResponse: xhr.responseText,
                            error: "Failed to parse JSON response"
                        });
                    }
                }
            };

            xhr.onerror = function() {
                reject({
                    status: 0,
                    statusText: "Network Error",
                    error: "Unable to connect to JsonPowerDB server"
                });
            };

            xhr.ontimeout = function() {
                reject({
                    status: 0,
                    statusText: "Timeout",
                    error: "Request timed out"
                });
            };

            xhr.timeout = 15000;
            xhr.send(JSON.stringify(imlPayload));
        });
    }

    // ─── Public API Methods ───────────────────────────────────

    /**
     * PUT: Create a new employee record.
     * @param {Object} record - Full employee record object including primary key
     * @returns {Promise<Object>} JPDB response
     */
    async function createRecord(record) {
        const payload = createIrlPayload("PUT", null, record);
        return await ajaxRequest("POST", getBaseUrl(), payload);
    }

    /**
     * GET: Retrieve an employee record by ID.
     * @param {string} empId - Employee ID (primary key value)
     * @returns {Promise<Object>} JPDB response with record data
     */
    async function getRecord(empId) {
        const payload = createIrlPayload("GET", empId, null);
        return await ajaxRequest("POST", getBaseUrl(), payload);
    }

    /**
     * UPDATE: Modify an existing employee record.
     * @param {string} empId - Employee ID to update
     * @param {Object} updatedData - Data fields to update
     * @returns {Promise<Object>} JPDB response
     */
    async function updateRecord(empId, updatedData) {
        // Ensure primary key is included
        const data = {
            [APP_CONFIG.primaryKey]: empId,
            ...updatedData
        };
        const payload = createIrlPayload("UPDATE", empId, data);
        return await ajaxRequest("POST", getBaseUrl(), payload);
    }

    /**
     * REMOVE: Delete an employee record by ID.
     * @param {string} empId - Employee ID to delete
     * @returns {Promise<Object>} JPDB response
     */
    async function removeRecord(empId) {
        const payload = createIrlPayload("REMOVE", empId, null);
        return await ajaxRequest("POST", getBaseUrl(), payload);
    }

    /**
     * Execute an IML command for record navigation.
     * Uses JsonPowerDB's Index Manipulation Language.
     * @param {string} command - IML command (FIRST_RECORD, LAST_RECORD, PREV_RECORD, NEXT_RECORD)
     * @param {string|null} currentId - Current record ID for PREV/NEXT context (optional)
     * @returns {Promise<Object>} JPDB response with the navigated record
     */
    async function executeImlCommand(command, currentId) {
        const imlPayload = {
            token: createTokenString(),
            dbName: APP_CONFIG.db.dbName,
            rel: APP_CONFIG.db.relationName,
            cmdStr: {
                [command]: (command === "PREV_RECORD" || command === "NEXT_RECORD")
                    ? currentId || "0"
                    : "0"
            },
            jsonStr: {}
        };

        return await ajaxImlRequest(imlPayload);
    }

    /**
     * Check JPDB server connectivity.
     * @returns {Promise<boolean>} True if connected, false otherwise
     */
    async function checkConnection() {
        try {
            // Try a simple IML operation to verify connectivity
            const imlPayload = {
                token: createTokenString(),
                dbName: APP_CONFIG.db.dbName,
                rel: APP_CONFIG.db.relationName,
                cmdStr: {
                    FIRST_RECORD: "0"
                },
                jsonStr: {}
            };

            const response = await ajaxImlRequest(imlPayload);
            // Even if there's no data, a response means we're connected
            return true;
        } catch (error) {
            console.error("JPDB Connection check failed:", error);
            return false;
        }
    }

    // ─── Expose Public API ───────────────────────────────────

    return {
        createRecord: createRecord,
        getRecord: getRecord,
        updateRecord: updateRecord,
        removeRecord: removeRecord,
        executeImlCommand: executeImlCommand,
        checkConnection: checkConnection
    };

})();
