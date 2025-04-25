"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSQLConnectionPool = void 0;
const mssql_1 = __importDefault(require("mssql"));
const database_1 = require("../config/database");
const setupSQLConnectionPool = async () => {
    try {
        const pool = await mssql_1.default.connect(database_1.config);
        console.log("---------> DB Connected <-----------");
        return pool;
    }
    catch (error) {
        console.error('Error setting up SQL connection pool:', error.message);
        throw error;
    }
};
exports.setupSQLConnectionPool = setupSQLConnectionPool;
