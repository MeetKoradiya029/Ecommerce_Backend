import sql from 'mssql';
import { config } from '../config/database';

export const setupSQLConnectionPool = async () => {
  try {
    const pool = await sql.connect(config);
    console.log("---------> DB Connected <-----------");
    
    return pool;
  } catch (error: any) {
    console.error('Error setting up SQL connection pool:', error.message)
    throw error;
  }
}



