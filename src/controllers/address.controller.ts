
import sql from 'mssql';

const saveUserAddress = async (req: any, res: any) => {


    try {
        const { user_id, name, phone_number, pincode, locality, address, city, state, landmark, alternate_phone, locationTypeTag } = req?.body;
        const pool = await req.sql

        let insertAddress = await pool.request()
            .input('user_id', sql.Int, user_id)
            .input('name', sql.NVarChar(255), name)
            .input('pincode', sql.NVarChar(10), pincode)
            .input('phone_number', sql.NVarChar(20), phone_number)
            .input('locality', sql.NVarChar(20), locality)
            .input('address', sql.NVarChar(sql.MAX), address)
            .input('city', sql.NVarChar(20), city)
            .input('state', sql.NVarChar(20), state)
            .input('locationTypeTag', sql.NVarChar(50), locationTypeTag)
            .input('landmark', sql.NVarChar(32), landmark)
            .input('alternate_phone', sql.NVarChar(20), alternate_phone)
            .query('INSERT INTO EcommerceUserAddresses (user_id, name, pincode, phone_number, locality, address, city, state, alternate_phone, locationTypeTag) VALUES (@user_id, @name, @pincode, @phone_number, @locality, @address, @city, @state, @alternate_phone, @locationTypeTag)');

        console.log("insertAddress >>>>", insertAddress);

        if (insertAddress.rowsAffected[0] > 0) {
            return res.status(200).json({
                flag: true,
                status: 200,
                message: "Address saved successfully!"
            });
        } else {
            // No rows affected, insert failed
            return res.status(403).json({
                flag: false,
                status: 403,
                message: "Failed to add user address!",
                data: {},
            });
        }
    } catch (error: any) {
        console.error('Error in adding user address:', error.message);
        return res.status(500).json({
            flag: false,
            error: error.message
        })
    }
}

const updateUserAddress = async (req: any, res: any) => {

    try {
        const { id, user_id, name, phone_number, pincode, locality, address, city, state, landmark, alternate_phone, locationTypeTag } = req?.body;
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
                dataType: sql.UniqueIdentifier,
                value: id
            })
        }

        if (user_id) {
            updateFields.push({
                name: 'user_id',
                dataType: sql.Int,
                value: user_id
            })
        }

        if (name) {
            updateFields.push({
                name: 'name',
                dataType: sql.NVarChar(255),
                value: name
            })
        }

        if (phone_number) {
            updateFields.push({
                name: 'phone_number',
                dataType: sql.NVarChar(20),
                value: phone_number
            })
        }

        if (pincode) {
            updateFields.push({
                name: 'pincode',
                dataType: sql.NVarChar(10),
                value: pincode
            })
        }

        if (locality) {
            updateFields.push({
                name: 'locality',
                dataType: sql.NVarChar(20),
                value: locality
            })
        }

        if (address) {
            updateFields.push({
                name: 'address',
                dataType: sql.NVarChar(sql.MAX),
                value: address
            })
        }

        if (city) {
            updateFields.push({
                name: 'city',
                dataType: sql.NVarChar(20),
                value: city
            })
        }

        if (state) {
            updateFields.push({
                name: 'state',
                dataType: sql.NVarChar(20),
                value: state
            })
        }

        if (locationTypeTag) {
            updateFields.push({
                name: 'locationTypeTag',
                dataType: sql.NVarChar(32),
                value: locationTypeTag
            })
        }

        if (alternate_phone) {
            updateFields.push({
                name: 'alternate_phone',
                dataType: sql.NVarChar(20),
                value: alternate_phone
            })
        }

        
        if (landmark) {
            updateFields.push({
                name: 'landmark',
                dataType: sql.NVarChar(32),
                value: landmark
            })
        }
        console.log("updateFields>>>>>>>>",updateFields);

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

        const request = await pool.request()
        updateFields.forEach((item: any) => {
            request
                .input(item?.name, item?.dataType, item.value);
        });
        

        const result = await request
            .execute('updateUserAddress');

        console.log("result >>>> update address", result.recordset[0]);
        return res.status(200).json({
            flag: true,
            status: 200,
            message: result.recordset[0]['message']
        });

    } catch (error: any) {
        console.error("Error updating user address: ", error);
        return res.status(500).json({
            flag: 0,
            status: 500,
            message: "Failed to update user address",
            error: error.message
        });
    }
}

const getUserAddressByUserId = async (req: any, res: any) => {

    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(500).json({
                flag: false,
                error: "Internal Server Error"
            })
        }

        const pool = await req?.sql;

        const result = await pool.request()
            .input('user_id', sql.Int, user_id)
            .query('SELECT * FROM EcommerceUserAddresses WHERE user_id = @user_id');

        console.log("user Addresses >>>>>>>", result.recordset);

        return res.status(200).json({
            flag: true,
            message: "User Address Fetched Successfully!",
            data: result.recordset
        });

    } catch (error: any) {
        return res.status(500).json({
            flag: false,
            message: error.message
        })
    }
}

const getUserAddressById = async (req: any, res: any) => {

    try {
        const { id } = req.query;

        if (!id) {
            return res.status(500).json({
                flag: false,
                error: "Internal Server Error"
            })
        }

        const pool = await req?.sql;

        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('SELECT * FROM EcommerceUserAddresses WHERE id = @id');

        console.log("user Address >>>>>>>", result.recordset);

        return res.status(200).json({
            flag: true,
            message: "User Address Fetched Successfully!",
            data: result.recordset[0]
        });

    } catch (error: any) {
        return res.status(500).json({
            flag: false,
            message: error.message
        })
    }
}

export default {
    saveUserAddress,
    updateUserAddress,
    getUserAddressByUserId,
    getUserAddressById
}