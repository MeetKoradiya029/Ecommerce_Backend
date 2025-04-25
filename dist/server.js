"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const user_route_1 = __importDefault(require("./src/routes/user.route"));
const product_route_1 = __importDefault(require("./src/routes/product.route"));
const category_route_1 = __importDefault(require("./src/routes/category.route"));
const connectDB_1 = require("./src/db/connectDB");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const multer_1 = __importDefault(require("multer"));
const seller_route_1 = __importDefault(require("./src/routes/seller.route"));
const upload = (0, multer_1.default)();
// Middleware to parse form-data
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const hostname = "192.168.1.117";
app.use(express_1.default.json());
//Middleware to setup sql connection pool
app.use(async (req, res, next) => {
    try {
        const pool = await (0, connectDB_1.setupSQLConnectionPool)();
        req.sql = pool;
        next();
    }
    catch (error) {
        next(error);
    }
});
app.use(body_parser_1.default.urlencoded({
    extended: true,
}));
app.use((0, cors_1.default)());
app.get("/api", async (req, res) => {
    try {
        res.send("Hello from E-commerce Server");
    }
    catch (error) {
    }
});
app.use(upload.any());
app.use((0, cookie_parser_1.default)());
app.use("/api/users", user_route_1.default);
app.use("/api/products", product_route_1.default);
app.use("/api/category", category_route_1.default);
app.use("/api/seller", seller_route_1.default);
app.listen(port, hostname, () => {
    console.log(`Server is listening on ${hostname}:${port}`);
});
