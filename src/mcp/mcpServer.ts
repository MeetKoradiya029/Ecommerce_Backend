
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

// // src/agents/mcpServer.ts

// // import { Server } from "@modelcontextprotocol/sdk/server/index.js";
// // import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// // import {
// //     CallToolRequestSchema,
// //     ListResourcesRequestSchema,
// //     ListToolsRequestSchema,
// //     ReadResourceRequestSchema,
// // } from "@modelcontextprotocol/sdk/types.js";
// // import pg from "pg";

// // export async function runMCPServer(databaseUrl: string) {
// //     const server = new Server(
// //         {
// //             name: "example-servers/postgres",
// //             version: "0.1.0",
// //         },
// //         {
// //             capabilities: {
// //                 resources: {},
// //                 tools: {},
// //             },
// //         }
// //     );

// //     const resourceBaseUrl = new URL(databaseUrl.replace(/:(.*)@/, "@"));
// //     resourceBaseUrl.protocol = "postgres:";
// //     resourceBaseUrl.password = "";

// //     const pool = new pg.Pool({ connectionString: databaseUrl });

// //     const SCHEMA_PATH = "schema";

// //     server.setRequestHandler(ListResourcesRequestSchema, async () => {
// //         const client = await pool.connect();
// //         try {
// //             const result = await client.query(
// //                 "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
// //             );
// //             return {
// //                 resources: result.rows.map((row) => ({
// //                     uri: new URL(`${row.table_name}/${SCHEMA_PATH}`, resourceBaseUrl).href,
// //                     mimeType: "application/schema+json",
// //                     name: `"${row.table_name}" database schema`,
// //                 })),
// //             };
// //         } finally {
// //             client.release();
// //         }
// //     });

// //     server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
// //         const resourceUrl = new URL(request.params.uri);
// //         const pathComponents = resourceUrl.pathname.split("/");
// //         const schema = pathComponents.pop();
// //         const tableName = pathComponents.pop();

// //         if (schema !== SCHEMA_PATH || !tableName || !/^[a-zA-Z0-9_]+$/.test(tableName)) {
// //             throw new Error("Invalid resource URI or table name");
// //         }

// //         const client = await pool.connect();
// //         try {
// //             const result = await client.query(
// //                 "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1",
// //                 [tableName]
// //             );
// //             return {
// //                 contents: [
// //                     {
// //                         uri: request.params.uri,
// //                         mimeType: "application/schema+json",
// //                         text: JSON.stringify(result.rows, null, 2),
// //                     },
// //                 ],
// //             };
// //         } finally {
// //             client.release();
// //         }
// //     });

// //     server.setRequestHandler(ListToolsRequestSchema, async () => ({
// //         tools: [
// //             {
// //                 name: "query",
// //                 description: "Run a read-only SQL query",
// //                 inputSchema: {
// //                     type: "object",
// //                     properties: {
// //                         sql: { type: "string" },
// //                     },
// //                 },
// //             },
// //         ],
// //     }));

// //     server.setRequestHandler(CallToolRequestSchema, async (request) => {
// //         if (request.params.name === "query") {
// //             const sql = request.params.arguments?.sql as string;
// //             const client = await pool.connect();
// //             try {
// //                 await client.query("BEGIN TRANSACTION READ ONLY");
// //                 const result = await client.query(sql);
// //                 return {
// //                     content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }],
// //                     isError: false,
// //                 };
// //             } catch (error: any) {
// //                 return {
// //                     content: [{ type: "text", text: `Query Error: ${error.message}` }],
// //                     isError: true,
// //                 };
// //             } finally {
// //                 await client.query("ROLLBACK").catch((e) =>
// //                     console.warn("Could not roll back transaction:", e)
// //                 );
// //                 client.release();
// //             }
// //         }
// //         throw new Error(`Unknown tool: ${request.params.name}`);
// //     });

// //     const transport = new StdioServerTransport();
// //     await server.connect(transport);
// // }

// //#endregion