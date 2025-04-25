"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importStar(require("mssql"));
const uploadToCloudinary_1 = require("../utils/uploadToCloudinary");
const getAllProducts = async (req, res) => {
    var _a, _b;
    try {
        let { category_id, skip, limit, min_price, max_price, search_term } = req.query;
        const pool = await req.sql;
        // let query = 'SELECT * FROM Ecommerce_Products';
        let getTotalRecords = 'SELECT COUNT(*) AS total_records FROM Ecommerce_Products';
        const totalRecordsResult = await pool.request().query(getTotalRecords);
        const totalRecords = totalRecordsResult === null || totalRecordsResult === void 0 ? void 0 : totalRecordsResult.recordset[0];
        // Add WHERE clause based on query parameters
        const request = await pool.request();
        let result;
        if (category_id > 0) {
            if (search_term) {
                result = await pool.request()
                    .input('category_id', mssql_1.default.Int, category_id)
                    .input('skip', mssql_1.default.Int, skip)
                    .input('limit', mssql_1.default.Int, limit)
                    .input('min_price', mssql_1.default.Int, min_price)
                    .input('max_price', mssql_1.default.Int, max_price)
                    .input('search_term', mssql_1.default.NVarChar(255), search_term)
                    .execute('getProductsWithCategoryAndPriceRange');
            }
            else {
                result = await pool.request()
                    .input('category_id', mssql_1.default.Int, category_id)
                    .input('skip', mssql_1.default.Int, skip)
                    .input('limit', mssql_1.default.Int, limit)
                    .input('min_price', mssql_1.default.Int, min_price)
                    .input('max_price', mssql_1.default.Int, max_price)
                    .execute('getProductsWithCategoryAndPriceRange');
            }
        }
        else {
            if (search_term) {
                result = await pool.request()
                    .input('category_id', mssql_1.default.Int, category_id)
                    .input('search_term', mssql_1.default.NVarChar(255), search_term)
                    .input('skip', mssql_1.default.Int, skip)
                    .input('limit', mssql_1.default.Int, limit)
                    .execute('getProductsWithCategoryAndPriceRange');
            }
            else {
                result = await pool.request()
                    .input('category_id', mssql_1.default.Int, category_id)
                    .input('skip', mssql_1.default.Int, skip)
                    .input('limit', mssql_1.default.Int, limit)
                    .execute('getProductsWithCategoryAndPriceRange');
            }
        }
        // const result = await request.execute('getProductsWithCategoryAndPriceRange');
        console.log("result of filters >>>>>>", result);
        if (((_a = result === null || result === void 0 ? void 0 : result.recordset) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            (_b = result === null || result === void 0 ? void 0 : result.recordset) === null || _b === void 0 ? void 0 : _b.forEach((item) => {
                item['images'] = JSON.parse(item.images);
            });
            return res.status(200).json({
                flag: 1,
                status: 200,
                message: "Products fetched successfully",
                data: result === null || result === void 0 ? void 0 : result.recordset,
                total_records: totalRecords === null || totalRecords === void 0 ? void 0 : totalRecords.total_records
            });
        }
        else {
            return res.status(404).json({
                flag: 0,
                status: 404,
                message: "No products found"
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
const addProduct = async (req, res) => {
    var _a, _b;
    const { name, description, price, stock_quantity, category_id, is_active } = req.body;
    console.log("req body >>>", req.body);
    let imageUploaded;
    try {
        const pool = await req.sql;
        const result = await pool.request()
            .input('name', mssql_1.default.NVarChar(255), name)
            .query('SELECT * FROM Ecommerce_Products WHERE name = @name');
        if (((_a = result === null || result === void 0 ? void 0 : result.recordset) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            return res.status(400).json({
                flag: 0,
                status: 400,
                message: "Product already exists!"
            });
        }
        console.log("req files>>>", req.files);
        if ((req === null || req === void 0 ? void 0 : req.files) && ((_b = req.files) === null || _b === void 0 ? void 0 : _b.length) > 0) {
            imageUploaded = await (0, uploadToCloudinary_1.uploadToCloudinary)(req === null || req === void 0 ? void 0 : req.files);
        }
        console.log("imageUploaded >>>>", imageUploaded);
        const insertUser = await pool.request()
            .input('name', mssql_1.default.NVarChar(255), name)
            .input('description', mssql_1.default.NVarChar(mssql_1.MAX), description)
            .input('price', mssql_1.default.Decimal(10, 2), price)
            .input('stock_quantity', mssql_1.default.Int, stock_quantity)
            .input('category_id', mssql_1.default.Int, category_id)
            .input('images', mssql_1.default.NVarChar(mssql_1.MAX), JSON.stringify(imageUploaded))
            .input('is_active', mssql_1.default.Bit, is_active)
            .query('INSERT INTO Ecommerce_Products (name, description, price, stock_quantity, category_id, images, is_active) VALUES (@name, @description, @price, @stock_quantity, @category_id, @images, @is_active)');
        if (insertUser.rowsAffected[0] > 0) {
            // Insert successful
            return res.status(200).json({
                flag: 1,
                status: 200,
                message: "Product Added Successfully!"
            });
        }
        else {
            // No rows affected, insert failed
            return res.status(403).json({
                flag: 0,
                status: 403,
                message: "Failed to Add Product!",
                data: {},
            });
        }
    }
    catch (error) {
        console.log("error >>>", error);
        return res.status(500).json({
            flag: 0,
            error: error.message
        });
    }
};
const updateProduct = async (req, res) => {
    var _a;
    let imageUploaded;
    try {
        console.log("req?.body in update product -----", req);
        const updateFields = [];
        const { id, name, description, price, stock_quantity, category_id, is_active } = await (req === null || req === void 0 ? void 0 : req.body);
        if (!id) {
            return res.status(400).json({
                flag: 0,
                status: 400,
                message: "Product ID is missing in the request parameters"
            });
        }
        if (id) {
            updateFields.push({
                name: 'id',
                dataType: mssql_1.default.Int,
                value: id
            });
        }
        if (name) {
            updateFields.push({
                name: 'name',
                dataType: mssql_1.default.NVarChar(255),
                value: name
            });
        }
        if (description) {
            updateFields.push({
                name: 'description',
                dataType: mssql_1.default.NVarChar(mssql_1.MAX),
                value: description
            });
        }
        if (price) {
            updateFields.push({
                name: 'price',
                dataType: mssql_1.default.Decimal(10, 2),
                value: price
            });
        }
        if (stock_quantity) {
            updateFields.push({
                name: 'stock_quantity',
                dataType: mssql_1.default.Int,
                value: stock_quantity
            });
        }
        if (category_id) {
            updateFields.push({
                name: 'category_id',
                dataType: mssql_1.default.Int,
                value: category_id
            });
        }
        if (is_active) {
            updateFields.push({
                name: 'is_active',
                dataType: mssql_1.default.Bit,
                value: is_active
            });
        }
        if ((req === null || req === void 0 ? void 0 : req.files) && ((_a = req.files) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            imageUploaded = await (0, uploadToCloudinary_1.uploadToCloudinary)(req === null || req === void 0 ? void 0 : req.files);
            updateFields.push({
                name: 'images',
                dataType: mssql_1.default.NVarChar(mssql_1.default.MAX),
                value: JSON.stringify(imageUploaded)
            });
        }
        const pool = await req.sql;
        const checkProduct = await pool.request()
            .input('id', mssql_1.default.Int, id)
            .query('SELECT * FROM Ecommerce_Products WHERE id = @id');
        if (!checkProduct.recordset || checkProduct.recordset.length === 0) {
            return res.status(404).json({
                flag: 0,
                status: 404,
                message: "Product not found!"
            });
        }
        const request = await pool.request();
        updateFields.forEach((item) => {
            request
                .input(item === null || item === void 0 ? void 0 : item.name, item === null || item === void 0 ? void 0 : item.dataType, item.value);
        });
        console.log("error in execute procedure >>", updateFields);
        const result = await request
            .execute('updateProduct', (err, result) => {
            if (err) {
                console.log("error in execute procedure >>", err);
            }
        });
        // console.log("result >>>> update product", result);
        return res.status(200).json({
            flag: 1,
            status: 200
            // message: result ? result.recordset[0]['message'] : ""
        });
    }
    catch (error) {
        console.error("Error updating product:", error);
        return res.status(500).json({
            flag: 0,
            status: 500,
            message: "Failed to update product",
            error: error.message
        });
    }
};
const deleteProduct = async (req, res) => {
    try {
        const { id } = req === null || req === void 0 ? void 0 : req.query;
        if (!id) {
            return res.status(400).json({
                flag: 0,
                status: 400,
                message: "Product ID is missing"
            });
        }
        const pool = await req.sql;
        if (id) {
            const checkProduct = await pool.request()
                .input('id', mssql_1.default.Int, id)
                .query('SELECT * FROM Ecommerce_Products WHERE id = @id');
            if (!checkProduct.recordset || checkProduct.recordset.length === 0) {
                return res.status(404).json({
                    flag: 0,
                    status: 404,
                    message: "Product not found!"
                });
            }
            await pool.request()
                .input('id', mssql_1.default.Int, id)
                .query('DELETE FROM Ecommerce_Products WHERE id = @id');
            return res.status(200).json({
                flag: 1,
                status: 200,
                message: "Product deleted successfully!"
            });
        }
        else {
            return res.status(500).json({
                flag: 0,
                status: 500,
                message: "Product id is required to delete this product",
            });
        }
    }
    catch (error) {
        console.error("Error deleting product:", error);
        return res.status(500).json({
            flag: 0,
            status: 500,
            message: "Id",
            error: error.message
        });
    }
};
const getProductById = async (req, res) => {
    var _a, _b;
    try {
        let { id } = req === null || req === void 0 ? void 0 : req.query;
        console.log("req >>>>", req);
        if (!id) {
            return res.status(400).json({
                flag: 0,
                status: 400,
                message: "Product ID is missing in the request parameters"
            });
        }
        id = parseInt((_a = req === null || req === void 0 ? void 0 : req.query) === null || _a === void 0 ? void 0 : _a.id);
        const pool = await req.sql;
        const checkProduct = await pool.request()
            .input('id', mssql_1.default.Int, id)
            .query('SELECT * FROM Ecommerce_Products WHERE id = @id');
        console.log("checkProduct.recordset >>---------->", checkProduct);
        if (!checkProduct.recordset || checkProduct.recordset.length === 0) {
            return res.status(404).json({
                flag: 0,
                status: 404,
                message: "Product not found!"
            });
        }
        (_b = checkProduct === null || checkProduct === void 0 ? void 0 : checkProduct.recordset) === null || _b === void 0 ? void 0 : _b.forEach((item) => {
            item['images'] = JSON.parse(item.images);
        });
        const productDetailsObj = checkProduct === null || checkProduct === void 0 ? void 0 : checkProduct.recordset[0];
        const sellerDetailResult = await pool.request()
            .input('Seller_Id', mssql_1.default.UniqueIdentifier, productDetailsObj.Seller_Id)
            .execute('getSellerFullDetails');
        return res.status(200).json({
            flag: 1,
            status: 200,
            message: "Product fetched successfully!",
            data: {
                product_details: checkProduct === null || checkProduct === void 0 ? void 0 : checkProduct.recordset[0],
                // seller_info:
            }
        });
    }
    catch (error) {
        console.error("Error fetching product:", error);
        return res.status(500).json({
            flag: 0,
            status: 500,
            message: "Failed to get product",
            error: error.message
        });
    }
};
const getTotalRecordsForProducts = async (req, res) => {
    var _a;
    try {
        const pool = await req.sql;
        let query = 'SELECT COUNT(*) AS total_records FROM Ecommerce_Products';
        const result = await pool.request().query(query);
        console.log("result total records >> >>>>>", result);
        if (((_a = result === null || result === void 0 ? void 0 : result.recordset) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            return res.status(200).json({
                flag: 1,
                message: "total records fetched!",
                data: result === null || result === void 0 ? void 0 : result.recordset[0]
            });
        }
        else {
            return res.status(404).json({
                flag: 0,
                status: 404,
                message: "No Records Found!"
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
// const updateProduct = async (req: any, res: any) => {
//     let imageUploaded: any;
//     try {
//         console.log("req?.body in update product -----", req);
//         const { id, name, description, price, stock_quantity, category_id, is_active } = await req?.body;
//         if (!id) {
//             return res.status(400).json({
//                 flag: 0,
//                 status: 400,
//                 message: "Product ID is missing in the request parameters"
//             });
//         }
//         const pool = await req.sql;
//         const checkProduct = await pool.request()
//             .input('id', sql.Int, id)
//             .query('SELECT * FROM Ecommerce_Products WHERE id = @id');
//         if (!checkProduct.recordset || checkProduct.recordset.length === 0) {
//             return res.status(404).json({
//                 flag: 0,
//                 status: 404,
//                 message: "Product not found!"
//             });
//         }
//         const updateQuery = `UPDATE Ecommerce_Products SET 
//                                 name = @name,
//                                 description = @description,
//                                 price = @price,
//                                 stock_quantity = @stock_quantity,
//                                 category_id = @category_id,
//                                 is_active = @is_active
//                             WHERE id = @id`;
//         await pool.request()
//             .input('id', sql.Int, id)
//             .input('name', sql.NVarChar(255), name)
//             .input('description', sql.NVarChar(sql.MAX), description)
//             .input('price', sql.Decimal(10, 2), price)
//             .input('stock_quantity', sql.Int, stock_quantity)
//             .input('category_id', sql.Int, category_id)
//             .input('is_active', sql.Bit, is_active)
//             .query(updateQuery);
//         // Handle Image update id new images provided
//         if (req?.files && req.files?.length > 0) {
//             imageUploaded = await uploadToCloudinary(req?.files);
//         }
//         const updateImageQuery = `UPDATE Ecommerce_Products SET images = @images WHERE id = @id`;
//         await pool.request()
//             .input('id', sql.Int, id)
//             .input('images', sql.NVarChar(sql.MAX), JSON.stringify(imageUploaded))
//             .query(updateImageQuery);
//         return res.status(200).json({
//             flag: 1,
//             status: 200,
//             message: "Product updated successfully!"
//         });
//     } catch (error: any) {
//         console.error("Error updating product:", error);
//         return res.status(500).json({
//             flag: 0,
//             status: 500,
//             message: "Failed to update product",
//             error: error.message
//         });
//     }
// }
exports.default = {
    addProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getTotalRecordsForProducts
};
