"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const saveSeller = async (req, res) => {
    try {
        console.log("req?.body in update product -----", req);
        // Category_Id, Business_Type_Id, Seller_Name, Contact_Name, Email, Phone_Number, Password, Address, City, State, Postal_Code, Country, Rating, Image, Return_Policy, Shipping_Policy, Seller_Since
        let { Seller_Name, Email, Phone_Number, Password, Address, City, State, Postal_Code, Return_Policy, Shipping_Policy, Seller_Since, Rating } = await (req === null || req === void 0 ? void 0 : req.body);
        Return_Policy = (Return_Policy || Return_Policy != undefined || Return_Policy != null) ? Return_Policy : null;
        Shipping_Policy = (Shipping_Policy || Shipping_Policy != undefined || Shipping_Policy != null) ? Shipping_Policy : null;
        Seller_Since = (Seller_Since || Seller_Since != undefined || Seller_Since != null) ? Seller_Since : null;
        Rating = (Rating || Rating != undefined || Rating != null) ? Rating : null;
        const pool = await req.sql;
        const checkSeller = await pool.request()
            .input('Email', mssql_1.default.NVarChar(255), Email)
            .query('SELECT * FROM Ecommerce_Seller WHERE Email = @Email');
        if (checkSeller.recordset && checkSeller.recordset.length > 0) {
            return res.status(401).json({
                flag: false,
                message: "User already exist!"
            });
        }
        const result = await pool.request()
            .input('Seller_Name', mssql_1.default.NVarChar(255), Seller_Name)
            .input('Email', mssql_1.default.NVarChar(255), Email)
            .input('Phone_Number', mssql_1.default.NVarChar(20), Phone_Number)
            .input('Password', mssql_1.default.NVarChar(255), Password)
            .input('Address', mssql_1.default.NVarChar(mssql_1.default.MAX), Address)
            .input('City', mssql_1.default.NVarChar(255), City)
            .input('State', mssql_1.default.NVarChar(255), State)
            .input('Postal_Code', mssql_1.default.NVarChar(20), Postal_Code)
            .input('Return_Policy', mssql_1.default.NVarChar(mssql_1.default.MAX), Return_Policy)
            .input('Shipping_Policy', mssql_1.default.NVarChar(mssql_1.default.MAX), Shipping_Policy)
            .input('Seller_Since', mssql_1.default.DateTime, Seller_Since)
            .execute('InsertEcommerceSeller');
        console.log("Seller Registered Success >>", result.recordset);
        // console.log("result >>>> update product", result);
        return res.status(200).json({
            flag: true,
            message: "Seller Saved Successfully!"
        });
    }
    catch (error) {
        console.error("Error saving seller:", error);
        return res.status(500).json({
            flag: 0,
            status: 500,
            message: "Failed to save seller",
            error: error.message
        });
    }
};
exports.default = {
    saveSeller
};
