import { Annotation, StateGraph } from "@langchain/langgraph";
// import { MCPQueryTool } from "../tools/mcpSqlTool";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { StructuredToolInterface } from "@langchain/core/tools";

// const mcpQueryTool = new MCPQueryTool();

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
});


const generateQuery = async (state: typeof StateAnnotation.State) => {
    // Use the LLM to generate a PostgreSQL query from the user's question
    const prompt = `
        You are a PostgreSQL query generator. Based on the user's question, generate a valid SQL query.
        Question: "${state.question}"
        SQL Query:
    `;

    const response = await llm.invoke([{ role: "user", content: prompt }]);
    const sqlQuery = response.text.trim();


    return { input: sqlQuery };
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
        const prompt = `
            You are a helpful AI assistant. Convert the SQL query result into a natural language answer for the user based on their original question.
            Question:${state.question}
            SQL Result (as JSON):${state.result}
            Provide a concise, human-readable answer:`;

        const response = await llm.invoke([{ role: "user", content: prompt }]);
        const answer = response.text.trim();
        console.log("Generated natural language answer >>>>", answer);

        return { answer };
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