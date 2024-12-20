import userService from "../services/user.service"
import sql, { DateTime } from 'mssql';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';


async function getAllUsers(req: any, res: any) {

  try {


    let { search_keyword, skip, limit } = req?.query;

    skip = parseInt(skip) || 0;
    limit = parseInt(limit) || 10;

    const pool = await req?.sql;


    const result = await pool.request()
      .query('SELECT * from Ecommerce_Users ORDER BY id OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY')

    if (!result?.recordset || result?.recordset?.length === 0) {
      return res.status(404).json({
        flag: 0,
        status: 404,
        message: "Users not found!",
        data: []
      });
    }

    return res.status(200).json({
      flag: 1,
      status: 200,
      message: "Users fetched successfully!",
      data: result.recordset
    });

  } catch (error: any) {
    console.error("Error:", error.message);
    res
      .status(500)
      .json({ error: "An error occurred while fetching Actovia Group." });
  }
}


const getUserById = async (req:any, res:any) => {
  try {
    let { user_id } = req?.query;

    if (!user_id) {
      return res.status(400).json({
        flag: 0,
        status: 400,
        message: "User id not found"
    });
    }

    user_id = parseInt(user_id)
    const pool = await req?.sql;

    const checkUser = await pool.request()
        .input('id', sql.Int, user_id)
        .query('SELECT * FROM Ecommerce_Users WHERE id = @id');
    console.log("CheckUser.recordset >>---------->",checkUser);
    

    if (!checkUser.recordset || checkUser.recordset.length === 0) {
        return res.status(404).json({
            flag: 0,
            status: 404,
            message: "User not found!"
        });
    }

    return res.status(200).json({
      flag: 1,
      status: 200,
      message: "Product fetched successfully!",
      data:checkUser?.recordset[0]
  });

  } catch (error:any) {
    console.error("Error fetching User:", error);
    return res.status(500).json({
        flag: 0,
        status: 500,
        message: "Failed to get user",
        error: error.message
    });
  } 
}

const loginUser = async (req: any, res: any) => {

  const { email, password } = req.body;


  try {
    const pool = await req.sql

    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Ecommerce_Users WHERE email = @email')

    if (result?.recordset?.length > 0) {

      const user = result?.recordset[0]
      const userId = user?.id
      console.log("user >>>", user);


      const userHashedPassword = user.password;

      const isPasswordCorrect = await bcrypt.compare(password, userHashedPassword);

      if (isPasswordCorrect) {

        const accessToken = jwt.sign({ id: userId }, "meet", { expiresIn: '2d' })

        const options = {
          httpOnly: true,
          secure: true
        }
        delete user["password"];
        delete user["updated_by"];
        delete user["updated_at"];
        delete user["created_at"];
        return res.status(200)
          .cookie("accessToken", accessToken, options)
          .json({
            flag: 1,
            status: 200,
            message: "Logged in successfully",
            token: accessToken,
            data: user
          });
      } else {
        return res.status(400).json({
          flag: 0,
          status: 400,
          message: "Incorrect password"
        });
      }

    } else {
      return res.status(404).json({
        flag: 0,
        status: 404,
        message: "User not found with this email"
      })
    }

  } catch (error: any) {
    console.error('Error :', error.message);
    return res.status(500).json({ error: error.message });
  }
}


const registerUser = async (req: any, res: any) => {

  const { first_name, last_name, email, phone_number, password, date_of_birth, gender, user_type } = req?.body;

  console.log("req body>>>>>", req);
  let hashedPassword: any;
  const saltRounds: number = 10;

  try {
    const pool = await req.sql
    console.log("connected !!!!!!!", pool);

    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Ecommerce_Users WHERE email = @email')

    if (result?.recordset?.length > 0) {
      return res.status(400).json({
        flag: 0,
        status: 400,
        message: "User already exists!"
      });
    }

    if (password) {
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    const birthDate = new Date(date_of_birth)
    console.log("birthDate >>", birthDate);


    const insertUser = await pool.request()
      .input('first_name', sql.NVarChar, first_name)
      .input('last_name', sql.NVarChar, last_name)
      .input('email', sql.NVarChar, email)
      .input('phone_number', sql.NVarChar, phone_number)
      .input('password', sql.NVarChar, hashedPassword)
      .input('date_of_birth', sql.Date, date_of_birth)
      .input('gender', sql.NVarChar, gender)
      .input('user_type', sql.Int, user_type)
      .query('INSERT INTO Ecommerce_Users (first_name, last_name, email, phone_number, password, date_of_birth, gender, user_type) VALUES (@first_name, @last_name, @email, @phone_number, @password, @date_of_birth, @gender, @user_type)');

    if (insertUser.rowsAffected[0] > 0) {
      // Insert successful

      const registeredUser = {
        first_name: first_name,
        last_name: last_name,
        email: email,
        phone_number: phone_number,
        date_of_birth: date_of_birth,
        gender: gender,
      }

      return res.status(200).json({
        flag: 1,
        status: 200,
        message: "User registered successfully!",
        data: registeredUser,
      });
    } else {
      // No rows affected, insert failed
      return res.status(403).json({
        flag: 0,
        status: 403,
        message: "Failed to register user!",
        data: {},
      });
    }
  } catch (error: any) {
    console.error('Error registering user:', error.message);
    return res.status(500).json({
      flag: 0,
      error: error.message
    })
  }
}



const logout = async (req: any, res: any) => {

  try {
    const options = {
      httpOnly: true,
      secure: true
    }

    return res.status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(
        {
          flag: 1,
          message: "User Logged Out Successfully"
        }
      )
  } catch (error) {
    const options = {
      httpOnly: true,
      secure: true
    }
    return res.status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(
        {
          flag: 0,
          message: "Something went wrong while logging out"
        }
      )
  }

}


const updateUser = async(req:any, res:any) => {
  try {
    const {id, first_name, last_name, email, phone_number, gender, updated_at, updated_by } = req?.body;
    const updateFields = [];

    if (!id) {
      return res.status(400).json({
          flag: 0,
          status: 400,
          message: "User id not found!"
      });
  }


    if (id) {
      updateFields.push({
          name: 'id',
          dataType: sql.Int,
          value: id
      });
    }
    if (first_name) {
      updateFields.push({
          name: 'first_name',
          dataType: sql.NVarChar(100),
          value: first_name
      });
    }
    if (last_name) {
      updateFields.push({
          name: 'last_name',
          dataType: sql.NVarChar(100),
          value: last_name
      });
    }
    if (email) {
      updateFields.push({
          name: 'email',
          dataType: sql.NVarChar(255),
          value: email
      });
    }
    if (phone_number) {
      updateFields.push({
          name: 'phone_number',
          dataType: sql.NVarChar(20),
          value: phone_number
      });
    }
    if (gender) {
      updateFields.push({
          name: 'gender',
          dataType: sql.NVarChar(10),
          value: gender
      });
    }
    if (updated_at) {
      updateFields.push({
          name: 'updated_at',
          dataType: sql.DateTime,
          value: updated_at
      });
    }
    if (updated_by) {
      updateFields.push({
          name: 'updated_by',
          dataType: sql.NVarChar(100),
          value: updated_by
      });
    }


    const pool = await req.sql;

        const checkUser = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Ecommerce_Users WHERE id = @id');

        if (!checkUser.recordset || checkUser.recordset.length === 0) {
            return res.status(404).json({
                flag: 0,
                status: 404,
                message: "User not found!"
            });
        }

        const request = pool.request()
        updateFields.forEach((item: any) => {
            request
                .input(item?.name, item?.dataType, item.value);
        });

        const result = await request
            .execute('updateUser');

        console.log("result >>>> update user", result.recordset[0]);
        return res.status(200).json({
            flag: 1,
            status: 200,
            message: result.recordset[0]['message']
        });
  } catch (error:any) {
    console.error("Error updating user:", error);
    return res.status(500).json({
        flag: 0,
        status: 500,
        message: "Failed to update user",
        error: error.message
    });
  }
}


export default {
  getAllUsers,
  loginUser,
  registerUser,
  logout,
  getUserById,
  updateUser
};
