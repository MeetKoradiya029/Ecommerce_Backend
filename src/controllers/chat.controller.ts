
import * as dotenv from "dotenv";
dotenv.config();
import { ChatOpenAI } from "@langchain/openai";
import { loadCompanyKnowledge } from "../utils/vectorStore";
import {  BufferMemory, ChatMessageHistory } from "langchain/memory";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import removeMarkdown from 'remove-markdown';
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import {
    AIMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
} from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { toolsCondition } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { PineconeStore } from "@langchain/pinecone";





const chatBotAssistant = async (req:any, res:any) => {
    try {
        const { prompt } = req.body;
        let vectorStore: PineconeStore|undefined = undefined

        /* ----- Variables For METHOD 3  --------*/
        //#region 
        const retrieveSchema = z.object({ query: z.string() });

        //#endregion

        const model = new ChatOpenAI({
            temperature: 0.7,
            model:'gpt-4.1-mini',
            openAIApiKey: process.env.OPENAI_API_KEY
        });
        

        const chatHistory = new ChatMessageHistory();
        const messages: BaseMessage[] = await chatHistory.getMessages();

        const memory = new BufferMemory({
            returnMessages: true,
            memoryKey: 'chat_history',
            chatHistory: chatHistory
        });

        // const retriver = await loadCompanyKnowledge();

        /*------------------------ METHOD 1 -------------------------*/
        //#region 

        vectorStore = global.globalVectorStore;

        if (!vectorStore) {
            vectorStore = await loadCompanyKnowledge();
        }
        // const vectorStore = await loadCompanyKnowledge();

        const retrieve = tool(
            async ({ query }) => {
                const normalizedQuery = query.trim().replace(/[?!.]*$/, ""); // Removes ?, !, .
                const retrievedDocs:any = await vectorStore?.similaritySearch(normalizedQuery, 10);
                console.log("retrievedDocs >>>", retrievedDocs);
                
                const serialized = retrievedDocs
                    .map(
                        (doc:any) => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`
                    )
                    .join("\n");
                return [serialized, retrievedDocs];
            },
            {
                name: "retrieve",
                description: "Retrieve information related to a query.",
                schema: retrieveSchema,
                responseFormat: "content_and_artifact",
            }
        );

        // console.log("tool >>>>", retrieve);
        

        // Step 1: Generate an AIMessage that may include a tool-call to be sent.
        async function queryOrRespond(state: typeof MessagesAnnotation.State) {

            console.log(" queryOrRespond Called ---");
            
            const llmWithTools = model.bindTools([retrieve]);
            const response = await llmWithTools.invoke(state.messages, {tool_choice:"required"});
            // MessagesState appends messages to state instead of overwriting
            return { messages: [response] };
        }

        // Step 2: Execute the retrieval.
        const tools = new ToolNode([retrieve]);
        // console.log("tools >>>>>>", tools);
        


        // Step 3: Generate a response using the retrieved content.
        async function generate(state: typeof MessagesAnnotation.State) {
            console.log(" generate() Called ---");
            // Get generated ToolMessages
            let recentToolMessages = [];
            for (let i = state["messages"].length - 1; i >= 0; i--) {
                let message = state["messages"][i];
                if (message instanceof ToolMessage) {
                    recentToolMessages.push(message);
                } else {
                    break;
                }
            }
            let toolMessages = recentToolMessages.reverse();

            // Format into prompt
            const docsContent = toolMessages.map((doc) => doc.content).join("\n");
            const systemMessageContent =
                "You are a strict assistant for question-answering tasks. " +
                "Only use the following retrieved context to answer the question. " +
                "Do NOT use any outside knowledge. " +
                "If the answer is not in the context, say 'I don't know'. Use three sentences maximum and keep the " +
                "answer concise." +
                "\n\n" +
                `${docsContent}`;

            const conversationMessages = state.messages.filter(
                (message:any) =>
                    message instanceof HumanMessage ||
                    message instanceof SystemMessage ||
                    (message instanceof AIMessage && message.tool_calls?.length == 0)
            );
            const prompt = [
                new SystemMessage(systemMessageContent),
                ...conversationMessages,
            ];

            // Run
            const response = await model.invoke(prompt);
            console.log(" generate() => response ----- : ", response);
            
            return { messages: [response] };
        }



        const graphBuilder = new StateGraph(MessagesAnnotation)
            .addNode("queryOrRespond", queryOrRespond)
            .addNode("tools", tools)
            .addNode("generate", generate)
            .addEdge("__start__", "queryOrRespond")
            .addConditionalEdges("queryOrRespond", toolsCondition, {
                __end__: "__end__",
                tools: "tools",
            })
            .addEdge("tools", "generate")
            .addEdge("generate", "__end__");

        const graph = graphBuilder.compile();


        const checkpointer = new MemorySaver();
        const graphWithMemory = graphBuilder.compile({ checkpointer });

        const threadId = req.body.threadId || req.sessionID || req.user?.id || "guest"; // You can use any unique ID here


        const threadConfig = {
            configurable: { thread_id: threadId }
        };

        // const result = await graphWithMemory.invoke(
        //     { messages: [new HumanMessage(prompt)] },
        //     threadConfig // <- pass thread_id here
        // );

        const pastMessages = await memory.chatHistory.getMessages();

        const result = await graph.invoke(
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

        //#endregion


        /* -------------------- METHOD - 2 ----------------------- */
        //#region 
        // const relevantDocs = await retriver.invoke(prompt);

        // const llm = new ChatOpenAI({
        //     temperature: 0,
        //     model: 'gpt-4o-mini',
        //     openAIApiKey: process.env.OPENAI_API_KEY
        // });

        // const context = relevantDocs.map((doc) => doc.pageContent).join('\n');

        // const response = await llm.invoke([
        //     {
        //         role: 'system',
        //         content: 'You are a helpful assistant that answers questions ONLY based on the provided context.',
        //     },
        //     {
        //         role: 'user',
        //         content: `Context:\n${context}\n\nQuestion: ${prompt}`,
        //     },
        // ]);

        // res.json({ answer: response.text });

        //#endregion

        /*--------------------------- METHOD 3 ---------------------------- */
        //#region 
        // const relevantDocs = await retriver.invoke(prompt);
        // const qaPrompt = new ChatPromptTemplate({
        //     inputVariables: ["input", "context", "chat_history"],
        //     promptMessages: [
        //         SystemMessagePromptTemplate.fromTemplate(`
        //         You are a helpful and precise assistant. Use ONLY the provided context to answer the user's question.

        //         CONTEXT:
        //         {context}

        //         INSTRUCTIONS:
        //         1. If the answer is fully in the context, respond with a clear and complete answer.
        //         2. If the context does NOT contain the information, say exactly: "The document doesn't contain information about [topic]."
        //         3. DO NOT use any external or general knowledge.
        //         4. Be specific about what part of the context supports your answer.
        //         5. Do not assume or guess anything beyond the document.

        //         Always be honest about what is and isn't in the document.`.trim()),
        //         new MessagesPlaceholder("chat_history"),
        //         HumanMessagePromptTemplate.fromTemplate("{input}"),
        //     ],
        // });

        // const stuffDocumentsChain = await createStuffDocumentsChain({
        //     llm: model,
        //     prompt: qaPrompt,
        // });

        // const retrievalChain = await createRetrievalChain({
        //     retriever: retriver,
        //     combineDocsChain: stuffDocumentsChain,
        // });

        // const response = await retrievalChain.invoke({
        //     input: prompt,
        //     chat_history: messages,
        // });

        // await chatHistory.addUserMessage(prompt);

        // const rawAnswer: string =
        //     typeof response?.answer === 'string'
        //         ? response.answer
        //         : typeof response?.result === 'string'
        //             ? response.result
        //             : "No answer generated.";

        // console.log("response >>>>>>>>", response);
        
        // const plainTextAnswer = removeMarkdown(rawAnswer);

        // await chatHistory.addAIMessage(plainTextAnswer);

        // res.json({
        //     input: prompt,
        //     answer: response.answer,
        //     debug: {
        //         retrieved_docs: relevantDocs.map(d => d.metadata?.source || "unknown"),
        //         raw_response: response,
        //     },
        // });
        //#endregion

    } catch (error:any) {
        console.log("error >>>>", error);
        
        res.status(500).json({ error: error?.message || "An error occurred processing your request" });
    }
}

export default  {
    chatBotAssistant
}