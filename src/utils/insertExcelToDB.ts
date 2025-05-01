import XLSX from 'xlsx';
import pg from "pg";



export async function dumpExcelToPostgreSQL() {
   

    const pool = new pg.Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'Meet',
        password: 'meet1234',
        port: 5432,
    });

    const client = await pool.connect();
    try {

        const workbook = XLSX.readFile('nyc_01.xlsx');

        // Get all sheet names
        const sheetNames = workbook.SheetNames;
        

        // Extract data from each sheet
        const sheetsData: any = {};
        sheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            
            
            sheetsData[sheetName] = XLSX.utils.sheet_to_json(worksheet);
            
        });

        // console.log("sheetsData >>>", sheetsData);
        
        await client.query('BEGIN'); // Start transaction

        for (const sheetName in sheetsData) {
            const data = sheetsData[sheetName];
            if (data.length === 0) continue; // Skip empty sheets

            // Generate a safe table name (replace spaces/special chars)
            const tableName = `sheet_${sheetName.replace(/\s+/g, '_')}`;

            // Drop table if it exists (optional)
            await client.query(`DROP TABLE IF EXISTS ${tableName}`);

            // Dynamically create table based on first row's keys
            const allkeys = getAllDistinctKeys(data);
            const columns = allkeys.map(key =>
                `${key} TEXT` // Default to TEXT (adjust types if needed)
            ).join(', ');

            console.log("columns >>>", columns);
            

            await client.query(`CREATE TABLE ${tableName} (${columns})`);

            // Insert data
            for (const row of data) {
                const sanitizedRow:any = {};
                Object.keys(row).forEach(key => {
                    const sanitizedKey = key.toLowerCase().replace(/\s+/g, '_');
                    sanitizedRow[sanitizedKey] = row[key];
                });

                
                
                // const values = keys.map(key => row[key]);
                const placeholders = allkeys.map((_, i) => `$${i + 1}`).join(', ');

              

                const values = allkeys.map(key => sanitizedRow[key as string] || null);

                

                await client.query(
                    `INSERT INTO ${tableName} (${allkeys.join(', ')}) VALUES (${placeholders})`,
                    values
                );
            }
        }

        await client.query('COMMIT'); // Commit transaction
        console.log('All sheets dumped to PostgreSQL successfully!');
    } catch (error) {
        await client.query('ROLLBACK'); // Rollback on error
        console.error('Error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}


function getAllDistinctKeys(data:any[]) {
    const keys = new Set();
    data.forEach(row => {
        Object.keys(row).forEach(key => {
            keys.add(key.toLowerCase().replace(/\s+/g, '_')); // Sanitize keys
        });
    });
    return Array.from(keys);
}

