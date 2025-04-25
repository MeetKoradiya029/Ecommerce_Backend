"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const saveUserAddress = async (req, res) => {
    try {
        const { user_id, name, phone_number, pincode, locality, address, city, state, landmark, alternate_phone, locationTypeTag } = req === null || req === void 0 ? void 0 : req.body;
        const pool = await req.sql;
        let insertAddress = await pool.request()
            .input('user_id', mssql_1.default.Int, user_id)
            .input('name', mssql_1.default.NVarChar(255), name)
            .input('pincode', mssql_1.default.NVarChar(10), pincode)
            .input('phone_number', mssql_1.default.NVarChar(20), phone_number)
            .input('locality', mssql_1.default.NVarChar(20), locality)
            .input('address', mssql_1.default.NVarChar(mssql_1.default.MAX), address)
            .input('city', mssql_1.default.NVarChar(20), city)
            .input('state', mssql_1.default.NVarChar(20), state)
            .input('locationTypeTag', mssql_1.default.NVarChar(50), locationTypeTag)
            .input('landmark', mssql_1.default.NVarChar(32), landmark)
            .input('alternate_phone', mssql_1.default.NVarChar(20), alternate_phone)
            .query('INSERT INTO EcommerceUserAddresses (user_id, name, pincode, phone_number, locality, address, city, state, alternate_phone, locationTypeTag) VALUES (@user_id, @name, @pincode, @phone_number, @locality, @address, @city, @state, @alternate_phone, @locationTypeTag)');
        console.log("insertAddress >>>>", insertAddress);
        if (insertAddress.rowsAffected[0] > 0) {
            return res.status(200).json({
                flag: true,
                status: 200,
                message: "Address saved successfully!"
            });
        }
        else {
            // No rows affected, insert failed
            return res.status(403).json({
                flag: false,
                status: 403,
                message: "Failed to add user address!",
                data: {},
            });
        }
    }
    catch (error) {
        console.error('Error in adding user address:', error.message);
        return res.status(500).json({
            flag: false,
            error: error.message
        });
    }
};
const updateUserAddress = async (req, res) => {
    try {
        const { id, user_id, name, phone_number, pincode, locality, address, city, state, landmark, alternate_phone, locationTypeTag } = req === null || req === void 0 ? void 0 : req.body;
        const updateFields = [];
        if (!id) {
            return res.status(400).json({
                flag: false,
                status: 400,
                message: "Bad Request"
            });
        }
        if (id) {
            updateFields.push({
                name: 'id',
                dataType: mssql_1.default.UniqueIdentifier,
                value: id
            });
        }
        if (user_id) {
            updateFields.push({
                name: 'user_id',
                dataType: mssql_1.default.Int,
                value: user_id
            });
        }
        if (name) {
            updateFields.push({
                name: 'name',
                dataType: mssql_1.default.NVarChar(255),
                value: name
            });
        }
        if (phone_number) {
            updateFields.push({
                name: 'phone_number',
                dataType: mssql_1.default.NVarChar(20),
                value: phone_number
            });
        }
        if (pincode) {
            updateFields.push({
                name: 'pincode',
                dataType: mssql_1.default.NVarChar(10),
                value: pincode
            });
        }
        if (locality) {
            updateFields.push({
                name: 'locality',
                dataType: mssql_1.default.NVarChar(20),
                value: locality
            });
        }
        if (address) {
            updateFields.push({
                name: 'address',
                dataType: mssql_1.default.NVarChar(mssql_1.default.MAX),
                value: address
            });
        }
        if (city) {
            updateFields.push({
                name: 'city',
                dataType: mssql_1.default.NVarChar(20),
                value: city
            });
        }
        if (state) {
            updateFields.push({
                name: 'state',
                dataType: mssql_1.default.NVarChar(20),
                value: state
            });
        }
        if (locationTypeTag) {
            updateFields.push({
                name: 'locationTypeTag',
                dataType: mssql_1.default.NVarChar(32),
                value: locationTypeTag
            });
        }
        if (alternate_phone) {
            updateFields.push({
                name: 'alternate_phone',
                dataType: mssql_1.default.NVarChar(20),
                value: alternate_phone
            });
        }
        if (landmark) {
            updateFields.push({
                name: 'landmark',
                dataType: mssql_1.default.NVarChar(32),
                value: landmark
            });
        }
        console.log("updateFields>>>>>>>>", updateFields);
        const pool = await req.sql;
        // const checkAddress = await pool.request()
        //     .input('id', sql.UniqueIdentifier, id)
        //     .query('SELECT * FROM EcommerceUserAddresses WHERE id = @id');
        // if (!checkAddress.recordset || checkAddress.recordset.length === 0) {
        //     return res.status(404).json({
        //         flag: 0,
        //         status: 404,
        //         message: "Address not found!"
        //     });
        // }
        const request = await pool.request();
        updateFields.forEach((item) => {
            request
                .input(item === null || item === void 0 ? void 0 : item.name, item === null || item === void 0 ? void 0 : item.dataType, item.value);
        });
        const result = await request
            .execute('updateUserAddress');
        console.log("result >>>> update address", result.recordset[0]);
        return res.status(200).json({
            flag: true,
            status: 200,
            message: result.recordset[0]['message']
        });
    }
    catch (error) {
        console.error("Error updating user address: ", error);
        return res.status(500).json({
            flag: 0,
            status: 500,
            message: "Failed to update user address",
            error: error.message
        });
    }
};
const getUserAddressByUserId = async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) {
            return res.status(500).json({
                flag: false,
                error: "Internal Server Error"
            });
        }
        const pool = await (req === null || req === void 0 ? void 0 : req.sql);
        const result = await pool.request()
            .input('user_id', mssql_1.default.Int, user_id)
            .query('SELECT * FROM EcommerceUserAddresses WHERE user_id = @user_id');
        console.log("user Addresses >>>>>>>", result.recordset);
        return res.status(200).json({
            flag: true,
            message: "User Address Fetched Successfully!",
            data: result.recordset
        });
    }
    catch (error) {
        return res.status(500).json({
            flag: false,
            message: error.message
        });
    }
};
const getUserAddressById = async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(500).json({
                flag: false,
                error: "Internal Server Error"
            });
        }
        const pool = await (req === null || req === void 0 ? void 0 : req.sql);
        const result = await pool.request()
            .input('id', mssql_1.default.UniqueIdentifier, id)
            .query('SELECT * FROM EcommerceUserAddresses WHERE id = @id');
        console.log("user Address >>>>>>>", result.recordset);
        return res.status(200).json({
            flag: true,
            message: "User Address Fetched Successfully!",
            data: result.recordset[0]
        });
    }
    catch (error) {
        return res.status(500).json({
            flag: false,
            message: error.message
        });
    }
};
exports.default = {
    saveUserAddress,
    updateUserAddress,
    getUserAddressByUserId,
    getUserAddressById
};
