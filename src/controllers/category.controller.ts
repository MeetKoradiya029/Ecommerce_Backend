


const getAllCategory = async (req: any, res: any) => {
    const { category_id, skip, limit } = req.query;
    try {
        const pool = await req.sql;
        let query = 'SELECT * FROM Ecommerce_Product_Category';

        // // Add WHERE clause based on query parameters
        // if (category_id) {
        //     query += ` WHERE category_id = '${category_id}'`;
        // }

        // // Add LIMIT and OFFSET clauses based on skip and limit
        // if (limit && skip) {
        //     query += ` ORDER BY id OFFSET ${parseInt(skip)} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY`;
        // }

        const result = await pool.request().query(query);

        if (result?.recordset?.length > 0) {
            return res.status(200).json({
                flag: 1,
                status: 200,
                message: "Categories fetched successfully",
                data: result.recordset
            });
        } else {
            return res.status(404).json({
                flag: 0,
                status: 404,
                message: "No categories found"
            });
        }

    } catch (error: any) {
        return res.status(500).json({
            flag: 0,
            error: error.message
        });
    }
}

export default {
    getAllCategory
}