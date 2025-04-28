import * as dotenv from "dotenv";
dotenv.config();
import { Annotation, MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { SqlDatabase } from "langchain/sql_db";
import { DataSource } from "typeorm";
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { QuerySqlTool } from "langchain/tools/sql";
import { StateGraph } from "@langchain/langgraph";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { uploadExcelToDB } from "../utils/insertExcelToDB";
import * as path from 'path';


const excelChatAssistance = async (req: any, res: any) => {

    try {
        const { prompt } = req.body;
         const filePath = path.join(process.cwd(), 'nyc_01.xlsx')

        const llm = new ChatOpenAI({
            temperature: 0.7,
            model: 'gpt-4.1-mini',
            openAIApiKey: process.env.OPENAI_API_KEY
        });

        const chatHistory = new ChatMessageHistory();
        const messages: BaseMessage[] = await chatHistory.getMessages();

        const memory = new BufferMemory({
            returnMessages: true,
            memoryKey: 'chat_history',
            chatHistory: chatHistory
        });

        const datasource = new DataSource({
            type: "mssql",                   // Change to mssql
            host: "127.0.0.1",         // e.g., "localhost" or an IP
            username: "sa",        // your MSSQL username
            password: "sa123$",        // your MSSQL password
            database: "Meet",   // your database name
            options: {
                encrypt: true,                  // Required if using Azure MSSQL; optional otherwise
                trustServerCertificate: true,   // If using self-signed certs locally
            },
        });

        const db = await SqlDatabase.fromDataSourceParams({
            appDataSource: datasource,
        });

        await uploadExcelToDB(filePath)


        const InputStateAnnotation = Annotation.Root({
            question: Annotation<string>
        });


        const StateAnnotation = Annotation.Root({
            question: Annotation<string>,
            query: Annotation<string>,
            result: Annotation<string>,
            answer: Annotation<string>,
        });

        const queryPromptTemplate = await pull<ChatPromptTemplate>(
            "langchain-ai/sql-query-system-prompt"
        );

        queryPromptTemplate.promptMessages.forEach((message) => {
            console.log(message.lc_kwargs.prompt.template);
        });

        const queryOutput = z.object({
            query: z.string().describe("Syntactically valid SQL query."),
        });


        const structuredLlm = llm.withStructuredOutput(queryOutput);

        const writeQuery = async (state: typeof InputStateAnnotation.State) => {
            const promptValue = await queryPromptTemplate.invoke({
                dialect: db.appDataSourceOptions.type,
                top_k: 10,
                table_info: await db.getTableInfo(),
                input: state.question,
            });
            const result = await structuredLlm.invoke(promptValue);
            return { query: result.query };
        };

        const executeQuery = async (state: typeof StateAnnotation.State) => {
            const executeQueryTool = new QuerySqlTool(db);
            return { result: await executeQueryTool.invoke(state.query) };
        };

        const generateAnswer = async (state: typeof StateAnnotation.State) => {
            const promptValue =
                "Given the following user question, corresponding SQL query, " +
                "and SQL result, answer the user question.\n\n" +
                `Question: ${state.question}\n` +
                `SQL Query: ${state.query}\n` +
                `SQL Result: ${state.result}\n`;
            const response = await llm.invoke(promptValue);
            return { answer: response.content };
        };

        const graphBuilder = new StateGraph({
            stateSchema: StateAnnotation,
        })
            .addNode("writeQuery", writeQuery)
            .addNode("executeQuery", executeQuery)
            .addNode("generateAnswer", generateAnswer)
            .addEdge("__start__", "writeQuery")
            .addEdge("writeQuery", "executeQuery")
            .addEdge("executeQuery", "generateAnswer")
            .addEdge("generateAnswer", "__end__");

        const graph = graphBuilder.compile();

        const checkpointer = new MemorySaver();
        const graphWithMemory:any = graphBuilder.compile({ checkpointer });

        const threadId = req.body.threadId || req.sessionID || req.user?.id || "guest"; // You can use any unique ID here


        const threadConfig = {
            configurable: { thread_id: threadId }
        };

        // const result = await graphWithMemory.invoke(
        //     { messages: [new HumanMessage(prompt)] },
        //     threadConfig // <- pass thread_id here
        // );

        const pastMessages = await memory.chatHistory.getMessages();

        const result = await graphWithMemory.invoke(
            {
                messages: [
                    ...pastMessages,
                    new HumanMessage(prompt)
                ]
            },
            threadConfig
        );

        // Step 7: Save latest to memory
        const newMessages = result.messages;
        for (const msg of newMessages) {
            await memory.chatHistory.addMessage(msg);
        }
        // console.log("final result >>>>>>>>>", result);


        // const finalAnswer = result.messages.find(msg => msg instanceof AIMessage)?.content;

        const finalAnswer = [...result.messages].reverse().find(msg => msg instanceof AIMessage)?.content;

        res.json({
            input: prompt,
            answer: finalAnswer
        });


    } catch (error:any) {
        console.log("error >>>", error);
        
        res.status(500).json({error:error.message})
    }

}






export default {
    excelChatAssistance
}


