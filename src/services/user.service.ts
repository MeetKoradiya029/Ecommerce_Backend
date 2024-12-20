// services/actoviaGroupService.js
import sql from "mssql";
import { config } from "../config/database";




async function getAllUsers(searchKeyword:any, skip:any, limit:any) {
  const pool = await sql.connect(config);
  const request = pool.request();
  let query = `
    SELECT * FROM Actovia_HS_combine_Group 
    ORDER BY [Contact Id]
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY`;

  if (searchKeyword) {
    request.input("searchKeyword", sql.NVarChar, `%${searchKeyword}%`);
    query = `
      SELECT * FROM Actovia_HS_combine_Group 
      WHERE Group_Name LIKE @searchKeyword
      ORDER BY [Contact Id]
      OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY`;
  }

  const result = await request
    .input("skip", sql.Int, skip)
    .input("limit", sql.Int, limit)
    .query(query);

  return result.recordset;
}

async function getActoviaGroupById(groupName:any) {
  const pool = await sql.connect(config);
  const request = pool.request();
  request.input("group_name", sql.NVarChar, groupName);
  const result = await request.query(
    `SELECT * FROM Actovia_HS_combine_Group WHERE Group_Name = @group_name`
  );

  return result.recordset;
}

async function registerUser(reqBody:any) {

  const { first_name, last_name, email, phone_number, username, password, date_of_birth, gender } = reqBody;
  try {

      let errorMsgIfUserExist:any = {}
      const pool = await sql.connect(config);
      const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Ecommerce_Users WHERE email = @email')

      if ((await result)?.recordset?.length > 0) {
          errorMsgIfUserExist.message
      }

  } catch (error) {
    
  }
  // const pool = await sql.connect(config);
  // const request = pool.request();
  // let query = `
  //   SELECT * FROM Actovia_HS_combine_Group 
  //   ORDER BY [Contact Id]
  //   OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY`;

  // if (searchKeyword) {
  //   request.input("searchKeyword", sql.NVarChar, `%${searchKeyword}%`);
  //   query = `
  //     SELECT * FROM Actovia_HS_combine_Group 
  //     WHERE Group_Name LIKE @searchKeyword
  //     ORDER BY [Contact Id]
  //     OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY`;
  // }

  // const result = await request
  //   .input("skip", sql.Int, skip)
  //   .input("limit", sql.Int, limit)
  //   .query(query);

  return;
}

async function loginUser(reqBody:any) {

  try {
    
  } catch (error) {
    
  }

  // const pool = await sql.connect(config);
  // const request = pool.request();
  // let query = `
  //   SELECT * FROM Actovia_HS_combine_Group 
  //   ORDER BY [Contact Id]
  //   OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY`;

  // if (searchKeyword) {
  //   request.input("searchKeyword", sql.NVarChar, `%${searchKeyword}%`);
  //   query = `
  //     SELECT * FROM Actovia_HS_combine_Group 
  //     WHERE Group_Name LIKE @searchKeyword
  //     ORDER BY [Contact Id]
  //     OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY`;
  // }

  // const result = await request
  //   .input("skip", sql.Int, skip)
  //   .input("limit", sql.Int, limit)
  //   .query(query);

  return;
}



export default {getAllUsers, registerUser, loginUser}
