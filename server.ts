import 'dotenv/config'
import express from 'express';
import bodyParser from "body-parser";
import cors from "cors";
import userRoutes from "./src/routes/user.route";
import productRoutes from "./src/routes/product.route"
import categoryRoutes from "./src/routes/category.route"
import { setupSQLConnectionPool } from './src/db/connectDB'
import cookieParser from "cookie-parser"
import multer from 'multer';
import sellerRoutes from './src/routes/seller.route'
import chatBotRoutes from './src/routes/chat.route'
import tempRoutes from './src/routes/tempRoute'
import { loadCompanyKnowledge } from './src/utils/vectorStore';
import sqlAgentRoutes from './src/routes/sqlAgent.routes';

const upload = multer();

// Middleware to parse form-data




const app = express();
const port: any = process.env.PORT || 3000;
const hostname = '192.168.1.117';

app.use(express.json())

app.use(cors());

app.options('*', cors());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://192.168.1.117:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

//Middleware to setup sql connection pool


app.use(async (req: any, res: any, next) => {
  try {
    const pool = await setupSQLConnectionPool();
    req.sql = pool;
    next();
  } catch (error) {
    next(error);
  }
})

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);




app.get("/api", async (req, res) => {
  try {
    res.send("Hello from E-commerce Server")
  } catch (error: any) {

  }
});

app.use(upload.any());

app.use(cookieParser());

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/chat", chatBotRoutes);
app.use("/tempRoute", tempRoutes);
app.use("/agents", sqlAgentRoutes);


async function main() {
  await loadCompanyKnowledge();
  startServer();
}


function startServer() {
  app.listen(port, hostname, () => {
    console.log(`Server is listening on ${hostname}:${port}`);
  });
}

main();