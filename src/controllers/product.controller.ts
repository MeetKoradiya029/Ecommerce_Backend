import sql, { MAX } from 'mssql';
import { uploadToCloudinary } from '../utils/uploadToCloudinary';



const getAllProducts = async (req: any, res: any) => {
    try {
        let { category_id, skip, limit, min_price, max_price, search_term } = req.query;

        const pool = await req.sql;
        // let query = 'SELECT * FROM Ecommerce_Products';
        let getTotalRecords = 'SELECT COUNT(*) AS total_records FROM Ecommerce_Products'
        const totalRecordsResult = await pool.request().query(getTotalRecords);
        const totalRecords = totalRecordsResult?.recordset[0];
        // Add WHERE clause based on query parameters

        const request = await pool.request();
        let result: any;

        if (category_id > 0) {
            if (search_term) {
                result = await pool.request()
                    .input('category_id', sql.Int, category_id)
                    .input('skip', sql.Int, skip)
                    .input('limit', sql.Int, limit)
                    .input('min_price', sql.Int, min_price)
                    .input('max_price', sql.Int, max_price)
                    .input('search_term', sql.NVarChar(255), search_term)
                    .execute('getProductsWithCategoryAndPriceRange');
            } else {
                result = await pool.request()
                    .input('category_id', sql.Int, category_id)
                    .input('skip', sql.Int, skip)
                    .input('limit', sql.Int, limit)
                    .input('min_price', sql.Int, min_price)
                    .input('max_price', sql.Int, max_price)
                    .execute('getProductsWithCategoryAndPriceRange');
            }


        } else {
            if (search_term) {
                result = await pool.request()
                    .input('category_id', sql.Int, category_id)
                    .input('search_term', sql.NVarChar(255), search_term)
                    .input('skip', sql.Int, skip)
                    .input('limit', sql.Int, limit)
                    .execute('getProductsWithCategoryAndPriceRange');
            } else {
                result = await pool.request()
                    .input('category_id', sql.Int, category_id)
                    .input('skip', sql.Int, skip)
                    .input('limit', sql.Int, limit)
                    .execute('getProductsWithCategoryAndPriceRange');
            }

        }
        // const result = await request.execute('getProductsWithCategoryAndPriceRange');
        console.log("result of filters >>>>>>", result);


        if (result?.recordset?.length > 0) {

            result?.recordset?.forEach((item: any) => {
                item['images'] = JSON.parse(item.images)
            });

            return res.status(200).json({
                flag: 1,
                status: 200,
                message: "Products fetched successfully",
                data: result?.recordset,
                total_records: totalRecords?.total_records
            });
        } else {
            return res.status(404).json({
                flag: 0,
                status: 404,
                message: "No products found"
            });
        }

    } catch (error: any) {
        return res.status(500).json({
            flag: 0,
            error: error.message
        });
    }
}


const addProduct = async (req: any, res: any) => {

    const { name, description, price, stock_quantity, category_id, is_active } = req.body;
    console.log("req body >>>", req.body);
    let imageUploaded: any;

    try {

        const pool = await req.sql;

        const result = await pool.request()
            .input('name', sql.NVarChar(255), name)
            .query('SELECT * FROM Ecommerce_Products WHERE name = @name')

        if (result?.recordset?.length > 0) {
            return res.status(400).json({
                flag: 0,
                status: 400,
                message: "Product already exists!"
            });
        }
        console.log("req files>>>", req.files);

        if (req?.files && req.files?.length > 0) {

            imageUploaded = await uploadToCloudinary(req?.files);
        }

        console.log("imageUploaded >>>>", imageUploaded);


        const insertUser = await pool.request()
            .input('name', sql.NVarChar(255), name)
            .input('description', sql.NVarChar(MAX), description)
            .input('price', sql.Decimal(10, 2), price)
            .input('stock_quantity', sql.Int, stock_quantity)
            .input('category_id', sql.Int, category_id)
            .input('images', sql.NVarChar(MAX), JSON.stringify(imageUploaded))
            .input('is_active', sql.Bit, is_active)
            .query('INSERT INTO Ecommerce_Products (name, description, price, stock_quantity, category_id, images, is_active) VALUES (@name, @description, @price, @stock_quantity, @category_id, @images, @is_active)');

        if (insertUser.rowsAffected[0] > 0) {
            // Insert successful

            return res.status(200).json({
                flag: 1,
                status: 200,
                message: "Product Added Successfully!"
            });
        } else {
            // No rows affected, insert failed
            return res.status(403).json({
                flag: 0,
                status: 403,
                message: "Failed to Add Product!",
                data: {},
            });
        }

    } catch (error: any) {
        console.log("error >>>", error);

        return res.status(500).json({
            flag: 0,
            error: error.message
        })
    }
}

const updateProduct = async (req: any, res: any) => {
    let imageUploaded: any;

    try {
        console.log("req?.body in update product -----", req);
        const updateFields = [];
        const { id, name, description, price, stock_quantity, category_id, is_active } = await req?.body;

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
                dataType: sql.Int,
                value: id
            })
        }

        if (name) {
            updateFields.push({
                name: 'name',
                dataType: sql.NVarChar(255),
                value: name
            })
        }

        if (description) {
            updateFields.push({
                name: 'description',
                dataType: sql.NVarChar(MAX),
                value: description
            })
        }

        if (price) {
            updateFields.push({
                name: 'price',
                dataType: sql.Decimal(10, 2),
                value: price
            })
        }

        if (stock_quantity) {
            updateFields.push({
                name: 'stock_quantity',
                dataType: sql.Int,
                value: stock_quantity
            })
        }

        if (category_id) {
            updateFields.push({
                name: 'category_id',
                dataType: sql.Int,
                value: category_id
            })
        }

        if (is_active) {
            updateFields.push({
                name: 'is_active',
                dataType: sql.Bit,
                value: is_active
            })
        }

        if (req?.files && req.files?.length > 0) {

            imageUploaded = await uploadToCloudinary(req?.files);

            updateFields.push({
                name: 'images',
                dataType: sql.NVarChar(sql.MAX),
                value: JSON.stringify(imageUploaded)
            });
        }

        const pool = await req.sql;

        const checkProduct = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Ecommerce_Products WHERE id = @id');

        if (!checkProduct.recordset || checkProduct.recordset.length === 0) {
            return res.status(404).json({
                flag: 0,
                status: 404,
                message: "Product not found!"
            });
        }

        const request = await pool.request()
        updateFields.forEach((item: any) => {
            request
                .input(item?.name, item?.dataType, item.value);
        });


        console.log("error in execute procedure >>", updateFields);

        const result = await request
            .execute('updateProduct', (err: any, result: any) => {
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

    } catch (error: any) {
        console.error("Error updating product:", error);
        return res.status(500).json({
            flag: 0,
            status: 500,
            message: "Failed to update product",
            error: error.message
        });
    }
}


const deleteProduct = async (req: any, res: any) => {

    try {
        const { id } = req?.query;

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
                .input('id', sql.Int, id)
                .query('SELECT * FROM Ecommerce_Products WHERE id = @id');


            if (!checkProduct.recordset || checkProduct.recordset.length === 0) {
                return res.status(404).json({
                    flag: 0,
                    status: 404,
                    message: "Product not found!"
                });
            }

            await pool.request()
                .input('id', sql.Int, id)
                .query('DELETE FROM Ecommerce_Products WHERE id = @id');


            return res.status(200).json({
                flag: 1,
                status: 200,
                message: "Product deleted successfully!"
            });

        } else {
            return res.status(500).json({
                flag: 0,
                status: 500,
                message: "Product id is required to delete this product",
            });
        }
    } catch (error: any) {
        console.error("Error deleting product:", error);
        return res.status(500).json({
            flag: 0,
            status: 500,
            message: "Id",
            error: error.message
        });
    }
}


const getProductById = async (req: any, res: any) => {

    try {
        let { id } = req?.query;
        console.log("req >>>>", req);


        if (!id) {
            return res.status(400).json({
                flag: 0,
                status: 400,
                message: "Product ID is missing in the request parameters"
            });
        }
        id = parseInt(req?.query?.id)
        const pool = await req.sql

        const checkProduct = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Ecommerce_Products WHERE id = @id');
        console.log("checkProduct.recordset >>---------->", checkProduct);


        if (!checkProduct.recordset || checkProduct.recordset.length === 0) {
            return res.status(404).json({
                flag: 0,
                status: 404,
                message: "Product not found!"
            });
        }

        checkProduct?.recordset?.forEach((item: any) => {
            item['images'] = JSON.parse(item.images)
        });
        const productDetailsObj = checkProduct?.recordset[0];

        const sellerDetailResult = await pool.request()
            .input('Seller_Id', sql.UniqueIdentifier, productDetailsObj.Seller_Id)
            .execute('getSellerFullDetails');

        return res.status(200).json({
            flag: 1,
            status: 200,
            message: "Product fetched successfully!",
            data: {
                product_details: checkProduct?.recordset[0],
                // seller_info:
            }
        });

    } catch (error: any) {
        console.error("Error fetching product:", error);
        return res.status(500).json({
            flag: 0,
            status: 500,
            message: "Failed to get product",
            error: error.message
        });
    }
}



const getTotalRecordsForProducts = async (req: any, res: any) => {

    try {
        const pool = await req.sql;
        let query = 'SELECT COUNT(*) AS total_records FROM Ecommerce_Products';


        const result = await pool.request().query(query);
        console.log("result total records >> >>>>>", result);


        if (result?.recordset?.length > 0) {

            return res.status(200).json({
                flag: 1,
                message: "total records fetched!",
                data: result?.recordset[0]
            });
        } else {
            return res.status(404).json({
                flag: 0,
                status: 404,
                message: "No Records Found!"
            });
        }

    } catch (error: any) {
        return res.status(500).json({
            flag: 0,
            error: error.message
        });
    }
}

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

export default {
    addProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getTotalRecordsForProducts
}