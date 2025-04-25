"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// services/actoviaGroupService.js
const mssql_1 = __importDefault(require("mssql"));
const database_1 = require("../config/database");
async function getAllUsers(searchKeyword, skip, limit) {
    const pool = await mssql_1.default.connect(database_1.config);
    const request = pool.request();
    let query = `
    SELECT * FROM Actovia_HS_combine_Group 
    ORDER BY [Contact Id]
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY`;
    if (searchKeyword) {
        request.input("searchKeyword", mssql_1.default.NVarChar, `%${searchKeyword}%`);
        query = `
      SELECT * FROM Actovia_HS_combine_Group 
      WHERE Group_Name LIKE @searchKeyword
      ORDER BY [Contact Id]
      OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY`;
    }
    const result = await request
        .input("skip", mssql_1.default.Int, skip)
        .input("limit", mssql_1.default.Int, limit)
        .query(query);
    return result.recordset;
}
async function getActoviaGroupById(groupName) {
    const pool = await mssql_1.default.connect(database_1.config);
    const request = pool.request();
    request.input("group_name", mssql_1.default.NVarChar, groupName);
    const result = await request.query(`SELECT * FROM Actovia_HS_combine_Group WHERE Group_Name = @group_name`);
    return result.recordset;
}
async function registerUser(reqBody) {
    var _a, _b;
    const { first_name, last_name, email, phone_number, username, password, date_of_birth, gender } = reqBody;
    try {
        let errorMsgIfUserExist = {};
        const pool = await mssql_1.default.connect(database_1.config);
        const result = await pool.request()
            .input('email', mssql_1.default.NVarChar, email)
            .query('SELECT * FROM Ecommerce_Users WHERE email = @email');
        if (((_b = (_a = (await result)) === null || _a === void 0 ? void 0 : _a.recordset) === null || _b === void 0 ? void 0 : _b.length) > 0) {
            errorMsgIfUserExist.message;
        }
    }
    catch (error) {
    }
    // const pool = await sql.connect(config);
    // const request = pool.request();
    // let query = `
    //   SELECT * FROM Actovia_HS_combine_Group 
    //   ORDER BY [Contact Id]
    //   OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY`;
    // if (searchKeyword) {
    //   request.input("searchKeyword", sql.NVarChar, `%${searchKeyword}%`);
    //   query = `
    //     SELECT * FROM Actovia_HS_combine_Group 
    //     WHERE Group_Name LIKE @searchKeyword
    //     ORDER BY [Contact Id]
    //     OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY`;
    // }
    // const result = await request
    //   .input("skip", sql.Int, skip)
    //   .input("limit", sql.Int, limit)
    //   .query(query);
    return;
}
async function loginUser(reqBody) {
    try {
    }
    catch (error) {
    }
    // const pool = await sql.connect(config);
    // const request = pool.request();
    // let query = `
    //   SELECT * FROM Actovia_HS_combine_Group 
    //   ORDER BY [Contact Id]
    //   OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY`;
    // if (searchKeyword) {
    //   request.input("searchKeyword", sql.NVarChar, `%${searchKeyword}%`);
    //   query = `
    //     SELECT * FROM Actovia_HS_combine_Group 
    //     WHERE Group_Name LIKE @searchKeyword
    //     ORDER BY [Contact Id]
    //     OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY`;
    // }
    // const result = await request
    //   .input("skip", sql.Int, skip)
    //   .input("limit", sql.Int, limit)
    //   .query(query);
    return;
}
exports.default = { getAllUsers, registerUser, loginUser };
