
import { Tool } from "@langchain/core/tools";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PassThrough } from "stream";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";

export class McpQueryTool extends Tool {
    name = "query";
    description = "Run a read-only SQL query against the database";

    private transport: StdioServerTransport;
    private inputStream: PassThrough;
    private outputStream: PassThrough;

    constructor(private mcpServer: Server) {
        super();

        this.inputStream = new PassThrough();
        this.outputStream = new PassThrough();

        // Setup the MCP transport using PassThrough streams
        this.transport = new StdioServerTransport(this.inputStream, this.outputStream);
        this.mcpServer.connect(this.transport);
    }

    async _call(input: string ): Promise<string> {
        const id = Date.now().toString();

    

        const message: JSONRPCMessage = {
            jsonrpc: "2.0",
            method: "callTool",
            params: {
                name: "query",
                arguments: { sql: input.replace(/```sql|```/g, "").trim() }, // Sanitize SQL input
            },
            id,
        };

        // Buffer and resolve output response line by line
        return new Promise((resolve, reject) => {
            let buffer = "";

            const onData = (chunk: Buffer) => {
                buffer += chunk.toString();

                let boundary: number;
                while ((boundary = buffer.indexOf("\n")) >= 0) {
                    const line = buffer.slice(0, boundary);
                    buffer = buffer.slice(boundary + 1);

                    try {
                        const response = JSON.parse(line);

                        if (response.id === id) {
                            this.outputStream.off("data", onData);
                            if (response.error) {
                                return reject(new Error(response.error.message));
                            }

                            const text = response.result?.content?.[0]?.text;
                            return resolve(text || "No content");
                        }
                    } catch (e) {
                        // Ignore JSON parse errors from partial lines
                    }
                }
            };

            this.outputStream.on("data", onData);

            // Write request
            this.inputStream.write(JSON.stringify(message) + "\n");
        });
    }
}



