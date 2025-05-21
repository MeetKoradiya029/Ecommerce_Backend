
//#region 
// src/mcp/startMcpServer.ts
import * as dotenv from "dotenv";
dotenv.config();

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import pg from "pg";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Readable, Writable } from "stream";

// Parse and sanitize the database URL
const databaseUrl = process.env.DATABASE_URL!;
const resourceBaseUrl = new URL(databaseUrl);
resourceBaseUrl.protocol = "postgres:";
resourceBaseUrl.password = ""; // Ensure password doesn't leak in URIs

export async function createMcpServer(input?: NodeJS.ReadableStream, output?: NodeJS.WritableStream) {
    console.error("✅ Initializing MCP Server...");

    const pool = new pg.Pool({ connectionString: databaseUrl });

    const server = new Server(
        {
            name: "embedded-postgres",
            version: "0.1.0",
        },
        {
            capabilities: {
                resources: {}, // Advertised as resource-capable
                tools: {
                    // Advertise the supported tool
                    query: {
                        description: "Run a read-only SQL query",
                        inputSchema: {
                            type: "object",
                            properties: {
                                sql: { type: "string" },
                            },
                            required: ["sql"],
                        },
                    },
                },
            },
        }
    );

    console.error("✅ MCP Server created. Setting up request handlers...");


    server.setRequestHandler(ListResourcesRequestSchema, async () => {
        console.error("✅ Handling ListResourcesRequest...");
        const client = await pool.connect();
        try {
            const result = await client.query(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
            );
            return {
                resources: result.rows.map((row) => ({
                    uri: new URL(`${row.table_name}/schema`, resourceBaseUrl).href,
                    mimeType: "application/schema+json",
                    name: `"${row.table_name}" database schema`,
                })),
            };
        } finally {
            client.release();
        }
    });

    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        console.error("✅ Handling ReadResourceRequest...");
        const resourceUrl = new URL(request.params.uri);
        const pathComponents = resourceUrl.pathname.split("/");
        const schema = pathComponents.pop();
        const tableName = pathComponents.pop();

        if (schema !== "schema" || !tableName) {
            throw new Error("Invalid resource URI or missing table name");
        }

        const client = await pool.connect();
        try {
            const result = await client.query(
                "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1",
                [tableName]
            );
            return {
                contents: [
                    {
                        uri: request.params.uri,
                        mimeType: "application/schema+json",
                        text: JSON.stringify(result.rows, null, 2),
                    },
                ],
            };
        } finally {
            client.release();
        }
    });

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [
            {
                name: "query",
                description: "Run a read-only SQL query",
                method:'callTool',
                inputSchema: {
                    type: "object",
                    properties: {
                        sql: { type: "string" },
                    },
                    required: ["sql"],
                },
            },
        ],
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        console.error("✅ Handling CallToolRequest...");
        if (request.params.name === "query") {
            const sql = `${request.params.arguments?.sql}`;
            console.log("sql>>>>", sql);
            const client = await pool.connect();
            try {
                await client.query("BEGIN TRANSACTION READ ONLY");
                
                const result = await client.query(sql);
                return {
                    content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }],
                    isError: false,
                };
            } catch (err: any) {
                return {
                    content: [{ type: "text", text: `❌ SQL Error: ${err.message}` }],
                    isError: true,
                };
            } finally {
                await client.query("ROLLBACK").catch(() => { });
                client.release();
            }
        }
        throw new Error(`Unknown tool: ${request.params.name}`);
    });

    // const transport = new StdioServerTransport(input as Readable, output as Writable);
    const transport = new StdioServerTransport(process.stdin as Readable, process.stdout as Writable);
    console.error("✅ Connecting server to stdio transport...");
    await server.connect(transport)

    console.error("✅ MCP Server connected to transport. Ready to handle requests.");
}

createMcpServer().catch((err) => {
    console.error("❌ MCP Server failed to start:", err);
    process.exit(1);
});
//#endregion


//#region 
/* USING SQL SERVER  */
//#region 
// src/mcp/startMcpServer.ts
// import * as dotenv from "dotenv";
// dotenv.config();


// import { Server } from "@modelcontextprotocol/sdk/server/index.js";
// import {
//     CallToolRequestSchema,
//     ListResourcesRequestSchema,
//     ListToolsRequestSchema,
//     ReadResourceRequestSchema,
// } from "@modelcontextprotocol/sdk/types.js";

// import sql from "mssql";
// import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// import { Readable, Writable } from "stream";
// import { config } from '../config/database';

// // SQL Server connection config from environment or hardcoded (customize as needed)


// // Used only for formatting schema URLs
// const resourceBaseUrl = new URL(`mssql://${config.server}/${config.database}`);

// export async function createMcpServer(input?: NodeJS.ReadableStream, output?: NodeJS.WritableStream) {
//     console.error("✅ Initializing MCP Server...");

//     const pool = await sql.connect(config);

//     const server = new Server(
//         {
//             name: "embedded-sqlserver",
//             version: "0.1.0",
//         },
//         {
//             capabilities: {
//                 resources: {},
//                 tools: {
//                     query: {
//                         description: "Run a read-only SQL query",
//                         inputSchema: {
//                             type: "object",
//                             properties: {
//                                 sql: { type: "string" },
//                             },
//                             required: ["sql"],
//                         },
//                     },
//                 },
//             },
//         }
//     );

//     console.error("✅ MCP Server created. Setting up request handlers...");

//     server.setRequestHandler(ListResourcesRequestSchema, async () => {
//         console.error("✅ Handling ListResourcesRequest...");
//         const request = new sql.Request(pool);
//         const result = await request.query(`
//             SELECT TABLE_NAME 
//             FROM INFORMATION_SCHEMA.TABLES 
//             WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_CATALOG = '${config.database}'
//         `);
//         return {
//             resources: result.recordset.map((row) => ({
//                 uri: new URL(`${row.TABLE_NAME}/schema`, resourceBaseUrl).href,
//                 mimeType: "application/schema+json",
//                 name: `"${row.TABLE_NAME}" database schema`,
//             })),
//         };
//     });

//     server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
//         console.error("✅ Handling ReadResourceRequest...");
//         const resourceUrl = new URL(request.params.uri);
//         const pathComponents = resourceUrl.pathname.split("/");
//         const schema = pathComponents.pop();
//         const tableName = pathComponents.pop();

//         if (schema !== "schema" || !tableName) {
//             throw new Error("Invalid resource URI or missing table name");
//         }

//         const sqlRequest = new sql.Request(pool);
//         const result = await sqlRequest.query(`
//             SELECT COLUMN_NAME, DATA_TYPE 
//             FROM INFORMATION_SCHEMA.COLUMNS 
//             WHERE TABLE_NAME = '${tableName}'
//         `);
//         return {
//             contents: [
//                 {
//                     uri: request.params.uri,
//                     mimeType: "application/schema+json",
//                     text: JSON.stringify(result.recordset, null, 2),
//                 },
//             ],
//         };
//     });

//     server.setRequestHandler(ListToolsRequestSchema, async () => ({
//         tools: [
//             {
//                 name: "query",
//                 description: "Run a read-only SQL query",
//                 method: 'callTool',
//                 inputSchema: {
//                     type: "object",
//                     properties: {
//                         sql: { type: "string" },
//                     },
//                     required: ["sql"],
//                 },
//             },
//         ],
//     }));

//     server.setRequestHandler(CallToolRequestSchema, async (request) => {
//         console.error("✅ Handling CallToolRequest...");
//         if (request.params.name === "query") {
//             const sqlText = `${request.params.arguments?.sql}`;
//             try {
//                 const result = await pool.request().query(sqlText);
//                 console.log("query result >>>", result);
                
//                 return {
//                     content: [{ type: "text", text: JSON.stringify(result.recordset, null, 2) }],
//                     isError: false,
//                 };
//             } catch (err: any) {
//                 return {
//                     content: [{ type: "text", text: `❌ SQL Error: ${err.message}` }],
//                     isError: true,
//                 };
//             }
//         }
//         throw new Error(`Unknown tool: ${request.params.name}`);
//     });

//     const transport = new StdioServerTransport(process.stdin as Readable, process.stdout as Writable);
//     console.error("✅ Connecting server to stdio transport...");
//     await server.connect(transport)

//     console.error("✅ MCP Server connected to transport. Ready to handle requests.");
// }

// createMcpServer().catch((err) => {
//     console.error("❌ MCP Server failed to start:", err);
//     process.exit(1);
// });
//#endregion

//#endregion