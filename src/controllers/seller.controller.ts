import sql from "mssql"


const saveSeller = async (req: any, res: any) => {

    try {
        console.log("req?.body in update product -----", req);

        // Category_Id, Business_Type_Id, Seller_Name, Contact_Name, Email, Phone_Number, Password, Address, City, State, Postal_Code, Country, Rating, Image, Return_Policy, Shipping_Policy, Seller_Since

        let { Seller_Name, Email, Phone_Number, Password, Address, City, State, Postal_Code, Return_Policy, Shipping_Policy, Seller_Since, Rating } = await req?.body;

        Return_Policy = (Return_Policy || Return_Policy != undefined || Return_Policy != null) ? Return_Policy : null;
        Shipping_Policy = (Shipping_Policy || Shipping_Policy != undefined || Shipping_Policy != null) ? Shipping_Policy : null;
        Seller_Since = (Seller_Since || Seller_Since != undefined || Seller_Since != null) ? Seller_Since : null;
        Rating = (Rating || Rating != undefined || Rating != null) ? Rating : null;

        const pool = await req.sql;

        const checkSeller = await pool.request()
            .input('Email', sql.NVarChar(255), Email)
            .query('SELECT * FROM Ecommerce_Seller WHERE Email = @Email');


        if (checkSeller.recordset && checkSeller.recordset.length > 0) {
            return res.status(401).json({
                flag: false,
                message: "User already exist!"
            });
        }

        const result = await pool.request()
            .input('Seller_Name', sql.NVarChar(255), Seller_Name)
            .input('Email', sql.NVarChar(255), Email)
            .input('Phone_Number', sql.NVarChar(20), Phone_Number)
            .input('Password', sql.NVarChar(255), Password)
            .input('Address', sql.NVarChar(sql.MAX), Address)
            .input('City', sql.NVarChar(255), City)
            .input('State', sql.NVarChar(255), State)
            .input('Postal_Code', sql.NVarChar(20), Postal_Code)
            .input('Return_Policy', sql.NVarChar(sql.MAX), Return_Policy)
            .input('Shipping_Policy', sql.NVarChar(sql.MAX), Shipping_Policy)
            .input('Seller_Since', sql.DateTime, Seller_Since)
            .execute('InsertEcommerceSeller');

        console.log("Seller Registered Success >>", result.recordset);


        // console.log("result >>>> update product", result);
        return res.status(200).json({
            flag: true,
            message: "Seller Saved Successfully!"
        });

    } catch (error: any) {
        console.error("Error saving seller:", error);
        return res.status(500).json({
            flag: 0,
            status: 500,
            message: "Failed to save seller",
            error: error.message
        });
    }
}


export default {
    saveSeller
}

