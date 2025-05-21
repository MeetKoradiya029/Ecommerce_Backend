import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { sqlAgentGraph } from "../langgraph/sqlAgentGraph";
import path from "path";
import { dumpExcelToPostgreSQL } from "../utils/insertExcelToDB";



export const sqlAgentChatBot = async (req: any, res: any) => {
    try {
        const { prompt, sessionId } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({ error: "Missing sessionId in request body." });
        }

        // const { stdin, stdout } = require('node:stream');

        // await dumpExcelToSQLServer(req.sql);
        await dumpExcelToPostgreSQL();

        const mcpServerPath = path.resolve(__dirname, "../mcp/mcpServer.ts");
    
        const client = new MultiServerMCPClient({
            embedded_postgres: {
                transport: "stdio",
                command: "ts-node",
                args: [mcpServerPath],
                restart: { enabled: true, maxAttempts: 3, delayMs: 1000 },
            },
        });

        

        // 2. Initialize connections to all servers
        await client.initializeConnections();

        // 3. Retrieve tools from the MCP server
        const tools = await client.getTools("embedded_postgres")   


    
        // Invoke the LangGraph workflow
        const state = await sqlAgentGraph.invoke(
            { 
                question: prompt,
                sessionId: sessionId,
                history: []     // This will be overwritten by `loadHistory` inside the graph 
            }, 
            {
            configurable: {
                tools: [...tools], // Pass the tools array
            },
        });

        await client.close();

        res.json({
            input: prompt,
            sql: state.input, // Include the generated SQL query in the response for debugging
            answer: state.answer,
        });
    } catch (error: any) {
        console.error("Error in sqlAgentChatBot:", error);
        res.status(400).json({ error: error.message });
    }
};