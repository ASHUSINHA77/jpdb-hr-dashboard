/**
 * HR Dashboard - Configuration Module
 * JsonPowerDB connection and database configuration
 */

const APP_CONFIG = {
    // JsonPowerDB Connection Settings
    jpdb: {
        baseUrl: "http://api.login2explore.com:5577",
        // IRL (Internal Resource Locator) - used for all API operations
        irl: "/api/irl",
        // IML (Index Manipulation Language) - used for operations on the relation
        iml: "/api/iml"
    },

    // Database Configuration
    db: {
        // Connection Token - Replace with your actual token from JPDB
        token: "90931543|-31948877595507617|90957434",

        // Database Name
        dbName: "HR-DB",

        // Relation (Table) Name
        relationName: "EMP-RECORDS"
    },

    // Primary Key Configuration
    primaryKey: "emp_id",

    // Toast notification duration (ms)
    toastDuration: 4000,

    // Confirmation dialog auto-close (ms)
    confirmTimeout: 15000
};

// Freeze config to prevent modification at runtime
Object.freeze(APP_CONFIG);
Object.freeze(APP_CONFIG.jpdb);
Object.freeze(APP_CONFIG.db);
