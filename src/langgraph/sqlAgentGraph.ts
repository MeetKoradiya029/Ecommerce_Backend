import { Annotation, StateGraph } from "@langchain/langgraph";
// import { MCPQueryTool } from "../tools/mcpSqlTool";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { StructuredToolInterface } from "@langchain/core/tools";
import pg from "pg";
import { Parser } from 'node-sql-parser';

// const mcpQueryTool = new MCPQueryTool();
 const pool = new pg.Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'Meet',
        password: 'meet1234',
        port: 5432,
    });

const llm = new ChatOpenAI({
    temperature: 0.7,
    model: 'gpt-4.1-mini',
    openAIApiKey: process.env.OPENAI_API_KEY
});
// Configure the LLM (e.g., OpenAI GPT)

const StateAnnotation = Annotation.Root({
    question: Annotation<string>(),
    input: Annotation<string>(),
    result: Annotation<string | undefined>(),
    answer: Annotation<string | undefined>(),
    history: Annotation<{ question: string, answer: string }[]>(),
    sessionId: Annotation<string>()
});

const parser = new Parser();

function isValidSQL(sql: string): boolean {
    try {
        parser.astify(sql);  // Try to parse the SQL
        return true;
    } catch (err:any) {
        console.warn("Invalid SQL detected >>>", err.message);
        return false;
    }
}

async function loadHistory(sessionId: string) {
    const res = await pool.query(
        `SELECT question, answer FROM chat_history WHERE session_id = $1 ORDER BY message_order`,
        [sessionId]
    );
    return res.rows;
}

async function saveHistory(sessionId: string, history: { question: string, answer: string }[]) {
    await pool.query(`DELETE FROM chat_history WHERE session_id = $1`, [sessionId]);
    const values = history.map((entry, idx) => [sessionId, idx, entry.question, entry.answer]);
    const query = `INSERT INTO chat_history (session_id, message_order, question, answer) VALUES ($1, $2, $3, $4)`;

    for (const row of values) {
        await pool.query(query, row);
    }
}



const generateQuery = async (state: typeof StateAnnotation.State) => {
    // Use the LLM to generate a PostgreSQL query from the user's question
    const sessionHistory = await loadHistory(state.sessionId);

    const conversationHistory = (sessionHistory || []).flatMap(entry => ([
        { role: "user", content: entry.question },
        { role: "assistant", content: entry.answer }
    ]));

    //#region
    // Prompt for SQL Server
    const prompt = `

        You are a SQL Server expert. Your job is to generate SQL queries only when exact answers are available from the provided context.

        STRICT RULES:
        - DO NOT make any assumptions or suggestions.
        - Always Convert Data types to SQL Server compatible types.
        - If the question and answer is available in provided conversation then use it from conversation history.
        - If the relationship between tables is not explicitly defined (like through keys, foreign keys, etc.), DO NOT generate a query.
        - If the question is not available in provided conversation, use the latest user message to generate the SQL query.

        CONTEXT:
        Conversation (JSON):
        ${JSON.stringify(sessionHistory, null, 2)}

        User Question: ${state.question}

        Output:
    `;
    //#endregion
 
    //#region 
    // Prompt for PostgreSQL
    // const prompt = `
    //     You are a PostgreSQL expert. Based on the provided conversation and the latest user message, write a SQL query.
    //     Always Convert Data types to PostgreSQL compatible types.
    //     You are not allowed to give answers based on assumptipons.
    //     If the question is available in provided conversation, give the answer from the given conversation history.
    //     If the question is not available in provided conversation, use the latest user message to generate the SQL query.
    //     Conversation (JSON):
    //     ${JSON.stringify(sessionHistory, null, 2)}

    //     User Question: ${state.question}
    //     SQL Query:

    // `;
    //#endregion
    

    const response = await llm.invoke([...conversationHistory,{ role: "user", content: prompt }]);
    const sqlQuery = response.text.trim();

    console.log("sqlQuery generated by LLM >>>", sqlQuery);
    


    return { input: sqlQuery, history: sessionHistory };
};

const executeQuery = async (state: typeof StateAnnotation.State, config: any) => {
   
    try {

        const tools = config.configurable?.tools;
        if (!tools || tools.length === 0) {
            throw new Error("❌ No tools found in LangGraph config.");
        }
        const queryTool = tools.find((tool: any) =>
            tool.name.endsWith("__query")
        );
        
        // console.log("Inner ZodObject shape >>>", queryTool.schema._def.schema.shape);
        const sanitizedSQL = state.input.replace(/```sql|```/g, "").trim();
        if (!isValidSQL(sanitizedSQL)) {
            console.warn("🚫 Input is not a valid SQL query. Skipping MCP execution.");
            return { result: sanitizedSQL };  // Return the message directly
        }
        console.log("sanitizedSQL >>>", sanitizedSQL);
        const result = await queryTool.invoke({ sql: sanitizedSQL });
        return { result };
    } catch (error) {
        console.error("Error invoking query tool:", error);
        throw error;
    }
};

const generateAnswer = async (state: typeof StateAnnotation.State) => {
    // Format the result into a user-friendly answer
    try {

        const conversationHistory = (state.history || []).flatMap(entry => ([
            { role: "user", content: entry.question },
            { role: "assistant", content: entry.answer }
        ]));
        const prompt = `
            You are a helpful AI assistant. Convert the SQL query result into a natural language answer for the user based on their original question.
            If user mention about specific result format then give answer into that format. For example user mentioned to give answer into table format the give answer into table format.
            If answer is available in conversation history or then give answer from it. You Are not allowed to give suggestions or any type of assumptions only give exact answers.
            If result of query is empty or length of records is zero then just say There is no data found for your question.    
            Question:${state.question}
            SQL Result (as JSON):${state.result}
            Provide a concise, human-readable answer:`;

        const response = await llm.invoke([...conversationHistory, { role: "user", content: prompt }]);
        const answer = response.text.trim();
        const updatedHistory = [...(state.history || []), { question: state.question, answer }];
        await saveHistory(state.sessionId, updatedHistory);
        console.log("Generated natural language answer >>>>", answer);

        return { answer, history: updatedHistory };
    } catch (error) {
        console.error("Error generating natural language answer:", error);
        return { answer: "Sorry, I couldn't generate a natural language response for this result." };
    }
};

export const sqlAgentGraph = new StateGraph(StateAnnotation)
    .addNode("generateQuery", generateQuery)
    .addNode("executeQuery", executeQuery)
    .addNode("generateAnswer", generateAnswer)
    .addEdge("__start__", "generateQuery")
    .addEdge("generateQuery", "executeQuery")
    .addEdge("executeQuery", "generateAnswer")
    .addEdge("generateAnswer", "__end__")
    .compile();