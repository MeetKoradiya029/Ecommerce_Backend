import * as ExcelJS from 'exceljs';
import * as sql from 'mssql';
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";



const sqlConfig: sql.config = {
    user: 'sa',
    password: 'sa123$',
    server: 'localhost',
    database: 'Meet',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

const server = new McpServer({
    name: "Demo",
    version: "1.0.0"
});



export async function uploadExcelToDB(filePath: string, tableName?: string) {
    const pool = await sql.connect(sqlConfig);
    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {});
    console.log("pool >>>", pool);
    
    console.log("workbookReader >>>>>", workbookReader);
    

   

    for await (const worksheetReader of workbookReader) {

        const sheetName = (worksheetReader as any).name; // fallback if not found
        const cleanSheetName = sheetName.replace(/[^a-zA-Z0-9_]/g, '_');

        console.log(`📝 Processing Sheet: ${cleanSheetName}`);
        let table: sql.Table | any = null;
        const batchSize = 5000;
        let rowCount = 0;

        const tableAlreadyExists = await tableExistInDB(pool, cleanSheetName);

        for await (const row of worksheetReader) {
            const sheetRow:any = row
            const columns = (sheetRow.values.slice(1) as string[]);
            if (columns.length !== 0) {
                // Only for first data set

                if (!tableAlreadyExists) {
                    await createTable(pool, cleanSheetName, columns);
                    console.log(`✅ Table [${cleanSheetName}] created.`);
                }
        
                table = new sql.Table(tableName);
                table.create = false;
                for (const col of columns) {
                    console.log("");
                    
                    table.columns.add(col, sql.NVarChar(sql.MAX)); // or better: detect type
                }
                continue; // Skip header row
            }


            table?.rows.add(...sheetRow.values.slice(1));
            rowCount++;

            console.log("");
            

            if (rowCount >= batchSize) {
                await pool.request().bulk(table);
                table = new sql.Table(tableName); // Reset table for next batch
                table.create = false;
                rowCount = 0;
            }
        }

        // Insert remaining rows
        if (table && table.rows.length > 0) {
            await pool.request().bulk(table);
        }
    }

    

    console.log('✅ Excel data uploaded successfully.');
}


async function tableExistInDB(pool: sql.ConnectionPool, tableName:string) : Promise<boolean>{
    const result = await pool.request()
    .input("tableName", sql.NVarChar, tableName)
    .query(`
        SELECT (CASE WHEN OBJECT_ID(@tableName, 'U') IS NOT NULL THEN 1 ELSE 0 END) AS isExists`);

    console.log("result", result);
    
    return result.recordset[0].isExists === 1
}


async function createTable(pool: sql.ConnectionPool, tableName:string, columns:string[]) {
    const columnsDefinition = columns.map(col => `[${col}] NVARCHAR(MAX)`).join(", ");

    const query =   `CREATE TABLE ${tableName} (${columnsDefinition})`

    await pool.request().query(query);
}