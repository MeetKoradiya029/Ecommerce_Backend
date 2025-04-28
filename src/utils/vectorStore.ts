
import * as dotenv from "dotenv";
dotenv.config();
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";


import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import * as cheerio from 'cheerio';
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

let globalVectorStore:PineconeStore | null = null;

declare global {
    var globalVectorStore: PineconeStore | undefined;
}


export async function loadCompanyKnowledge() {

    if (global.globalVectorStore) {
        return global.globalVectorStore;
    }

    /*------------ Load Documents ------------*/
    //#region 
    const filePath = path.join(process.cwd(), 'Docker_Guide.pdf')
    // const dataBuffer = fs.readFileSync(filePath);
    // const pdfData = await pdfParse(dataBuffer);
    // const text = pdfData.text;
    // const loader = new DocxLoader(filePath);
    const loader = new PDFLoader(filePath);
    const docs = await loader.load()
    //#endregion

    
    //#region 
    // const cheerioLoader = new CheerioWebBaseLoader("https://www.datasostech.com/about-us/",{
    //     selector:"body"
    // });

    // const docs = await cheerioLoader.load();
    //#endregion


    
    

    const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY!,
        model: 'text-embedding-3-large',
    });
    // console.log("embeddings >>>", embeddings);


    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200
    });

    // const docs = await splitter.createDocuments([text]);

    const splitDocs = await splitter.splitDocuments(docs)
    
    
    
    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY || ""
    })

    // const pineconeIndex = pinecone.index(
    //     process.env.PINECONE_INDEX!
    // );

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex: pinecone.Index(process.env.PINECONE_INDEX!),
    });

    // await vectorStore.addDocuments(splitDocs);

    const batchSize = 50;

    for (let i = 0; i < splitDocs.length; i += batchSize) {
        const batch = splitDocs.slice(i, i + batchSize);
        await vectorStore.addDocuments(batch);
        console.log(`Uploaded batch ${i / batchSize + 1}`);
    }

    global.globalVectorStore = vectorStore;


    // console.log("vectorStore >>>", vectorStore);
    
    // return vectorStore.asRetriever({
    //     k: 4
    // });

    return global.globalVectorStore

}