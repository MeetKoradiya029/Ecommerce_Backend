"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getAllCategory = async (req, res) => {
    var _a;
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
        if (((_a = result === null || result === void 0 ? void 0 : result.recordset) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            return res.status(200).json({
                flag: 1,
                status: 200,
                message: "Categories fetched successfully",
                data: result.recordset
            });
        }
        else {
            return res.status(404).json({
                flag: 0,
                status: 404,
                message: "No categories found"
            });
        }
    }
    catch (error) {
        return res.status(500).json({
            flag: 0,
            error: error.message
        });
    }
};
exports.default = {
    getAllCategory
};
