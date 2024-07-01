import express from "express";
import pg from "pg";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyUser, verifyAdmin } from "./utils/verifyToken.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

//database connection
export const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

try {
  db.connect();
  console.log("Connect to PostgreSQL");
} catch (error) {
  console.log("Failed to connect PostgreSQL");
}

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());

// Test route
app.get("/", (req, res) => {
  res.send("API is running normally.");
});

// register
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;

  // hash password
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  try {
    const result = await db.query(
      "INSERT INTO users (username, email, password ) VALUES ($1, $2, $3) RETURNING *",
      [username, email, hashPassword]
    );

    res
      .status(201)
      .json({
        success: true,
        message: "User created successfully",
        data: result.rows[0],
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to create user , This email or username already exist",
        error: error.message,
      });
    console.log("Failed to create new user", error);
  }
});

// login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // ค้นหาผู้ใช้จากอีเมล
    const emailCheck = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (emailCheck.rows.length === 0) {
      // หากไม่พบผู้ใช้ในฐานข้อมูล
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const user = emailCheck.rows[0];

    // ตรวจสอบรหัสผ่าน
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      // หากรหัสผ่านไม่ถูกต้อง
      return res
        .status(400)
        .json({ success: false, message: "Invalid password, Plase try again" });
    }

    // create jwt token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    // set token in browser  cookies and send the response to the client

    res
      .cookie("accessToken", token, {
        httpOnly: true,
        expires: token.expiresIn,
      })
      .status(200)
      .json({
        success: true,
        message: "Login successful with cokkie",
        token: token,
        data: user,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to login",
        error: error.message,
      });
    console.log("Failed to login", error);
  }
});

// post
app.post("/api/tours", verifyAdmin, async (req, res) => {
  const {
    title,
    city,
    address,
    distance,
    photo,
    description,
    price,
    maxGroupSize,
    featured,
  } = req.body;

  try {
    const result = await db.query(
      "INSERT INTO tours (title, city, address, distance, photo, description, price, maxGroupSize, featured) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING * ",
      [
        title,
        city,
        address,
        distance,
        photo,
        description,
        price,
        maxGroupSize,
        featured,
      ]
    );

    res
      .status(201)
      .json({
        success: true,
        message: "Tour created successfully",
        data: result.rows[0],
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to create tour",
        error: error.message,
      });
    console.log("Failed to create new Tours", error);
  }
});

// update
app.put("/api/tours/:id", verifyAdmin, async (req, res) => {
  const id = req.params.id;
  const {
    title,
    city,
    address,
    distance,
    photo,
    description,
    price,
    maxGroupSize,
    featured,
  } = req.body;

  try {
    const result = await db.query(
      "UPDATE tours SET title = $1, city = $2, address = $3, distance = $4, photo = $5, description = $6, price = $7, maxGroupSize = $8, featured = $9, updated_at = CURRENT_TIMESTAMP WHERE id = $10 RETURNING *",
      [
        title,
        city,
        address,
        distance,
        photo,
        description,
        price,
        maxGroupSize,
        featured,
        id,
      ]
    );

    if (result.rows.length > 0) {
      res
        .status(200)
        .json({
          success: true,
          message: "Tour updated successfully",
          data: result.rows[0],
        });
    } else {
      res.status(404).json({ success: false, message: "Tour not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to update tour",
        error: error.message,
      });
    console.log("Failed to update tour", error);
  }
});

//delete
app.delete("/api/tours/:id", verifyAdmin, async (req, res) => {
  const id = req.params.id;

  try {
    const result = await db.query(
      "DELETE FROM tours WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length > 0) {
      res
        .status(200)
        .json({ success: true, message: "Tour deleted successfully" });
    } else {
      res.status(404).json({ success: false, message: "Tour not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to delete tour",
        error: error.message,
      });
    console.log("Failed to delete tour", error);
  }
});

// getSingleTour
app.get("/api/tours/:id", async (req, res) => {
  const id = req.params.id;

  try {
    // เรียกข้อมูลทัวร์
    const tourResult = await db.query("SELECT * FROM tours WHERE id = $1", [
      id,
    ]);

    // เรียกข้อมูลรีวิวที่เกี่ยวข้องกับทัวร์ ในแต่ละ id
    const reviewsResult = await db.query(
      `SELECT * FROM tour_reviews WHERE tour_id = $1`,
      [id]
    );

    if (tourResult.rows.length > 0) {
      const tour = tourResult.rows[0];
      const reviews = reviewsResult.rows;
      res
        .status(200)
        .json({
          success: true,
          message: "Get single tour successfully",
          data: { tour, reviews },
        });
    } else {
      res.status(404).json({ success: false, message: "Tour not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to get single tour",
        error: error.message,
      });
    console.log("Failed to get single tour", error);
  }
});

// getAlltours + get tour_reviews
app.get("/api/tours", async (req, res) => {
  const page = parseInt(req.query.page) || 0;

  try {
    const result = await db.query(
      `SELECT tours.*, COALESCE(json_agg(tour_reviews.*), '[]') AS reviews 
            FROM tours LEFT JOIN tour_reviews ON tours.id = tour_reviews.tour_id 
            GROUP BY tours.id 
            ORDER BY tours.id 
            OFFSET $1 LIMIT 8`,
      [page * 8]
    );

    res
      .status(200)
      .json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch tours",
        error: error.message,
      });
    console.log("Failed to fetch tours", error);
  }
});

// search tour
app.get("/api/tours/search/getTourBysearch", async (req, res) => {
  const city = req.query.city;
  const distance = parseInt(req.query.distance);
  const maxGroupSize = parseInt(req.query.maxGroupSize);

  try {
    const result = await db.query(
      `SELECT tours.*, COALESCE(json_agg(tour_reviews.*), '[]') AS reviews 
            FROM tours LEFT JOIN tour_reviews ON tours.id = tour_reviews.tour_id 
            WHERE tours.city ILIKE $1 AND tours.distance >= $2 AND tours.maxGroupSize >= $3
            GROUP BY tours.id`,
      [city, distance, maxGroupSize]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to search tours",
        error: error.message,
      });
    console.log("Failed to search tours", error);
  }
});

//get featured tour
app.get("/api/tours/search/getFeaturedTours", async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  try {
    const result = await db.query(
      `SELECT tours.*, COALESCE(json_agg(tour_reviews.*), '[]') AS reviews 
            FROM tours 
            LEFT JOIN tour_reviews ON tours.id = tour_reviews.tour_id 
            WHERE tours.featured = true 
            GROUP BY tours.id 
            ORDER BY tours.id 
            OFFSET $1 
            LIMIT 8`,
      [page * 8]
    );

    res
      .status(200)
      .json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch tours",
        error: error.message,
      });
    console.log("Failed to fetch tours", error);
  }
});

// get tour counts
app.get("/api/tour/search/getTourCount", async (req, res) => {
  try {
    const result = await db.query("SELECT COUNT(*) FROM tours");
    const tourCount = parseInt(result.rows[0].count);

    res.status(200).json({ success: true, count: tourCount });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch tour count",
        error: error.message,
      });
    console.log("Failed to fetch tour count", error);
  }
});

// users part

// update users
app.put("/users/:id", verifyUser, async (req, res) => {
  const id = req.params.id;
  const { username, email, password, photo } = req.body;
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  try {
    const result = await db.query(
      "UPDATE users SET username = $1, email = $2, password = $3, photo = $4  updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *",
      [username, email, hashPassword, photo, id]
    );

    if (result.rows.length > 0) {
      res
        .status(200)
        .json({
          success: true,
          message: "User updated successfully",
          data: result.rows[0],
        });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to update user",
        error: error.message,
      });
    console.log("Failed to update user", error);
  }
});

//delete users
app.delete("/users/:id", verifyUser, async (req, res) => {
  const id = req.params.id;

  try {
    const result = await db.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length > 0) {
      res
        .status(200)
        .json({ success: true, message: "User deleted successfully" });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to delete user",
        error: error.message,
      });
    console.log("Failed to delete user", error);
  }
});

// getSingle
app.get("/users/:id", verifyUser, async (req, res) => {
  const id = req.params.id;

  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    if (result.rows.length > 0) {
      res
        .status(200)
        .json({ success: true, message: "User found", data: result.rows[0] });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch user",
        error: error.message,
      });
    console.log("Failed to fetch user", error);
  }
});

// getAlluser
app.get("/users", verifyAdmin, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM users");
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch tours",
        error: error.message,
      });
    console.log("Failed to fetch tours", error);
  }
});

// reviews
app.post("/api/review/:tourId", async (req, res) => {
  const tourId = req.params.tourId; // รับค่ามาจาก endpoint
  const { username, review_text, rating } = req.body;

  // ตรวจสอบข้อมูลที่รับมา
  if (!username && !review_text && rating == null) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });
  }

  if (!review_text) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Please fill out a message before submitting.",
      });
  }

  if (!rating) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Please select rating star before submitting.",
      });
  }

  try {
    // เพิ่มข้อมูลรีวิวใหม่ลงในตาราง tour_reviews
    const newReview = await db.query(
      `INSERT INTO tour_reviews (tour_id, username, review_text, rating)
            VALUES ($1, $2, $3, $4) RETURNING id`,
      [tourId, username, review_text, rating]
    );
    res
      .status(200)
      .json({
        success: true,
        message: "Review submitted.",
        data: newReview.rows[0],
      });
  } catch (error) {
    console.error("Error submitting review:", error); // log ข้อผิดพลาดที่ละเอียดขึ้น
    res
      .status(500)
      .json({ success: false, message: "Failed to submit review." });
  }
});

//Booking part

//booking
app.post("/api/booking", async (req, res) => {
  const { userId, userEmail, tourName, fullName, guestSize, phone, bookAt } =
    req.body;

  try {
    const result = await db.query(
      "INSERT INTO bookings (userId , userEmail ,tourName  , fullName , guestSize , phone , bookAt ) VALUES ($1 , $2 ,$3 ,$4 ,$5 ,$6 ,$7)",
      [userId, userEmail, tourName, fullName, guestSize, phone, bookAt]
    );
    res
      .status(200)
      .json({
        success: true,
        message: "Your tour is booked.",
        data: result.rows[0],
      });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({
        success: false,
        message: "Please fill in your booking information before submitting.",
      });
  }
});

// get single booking
app.get("/api/booking/:id", verifyUser, async (req, res) => {
  const id = req.params.id;

  try {
    const result = await db.query("SELECT * FROM bookings WHERE id = $1", [id]);
    res
      .status(200)
      .json({ success: true, message: "Successful", data: result.rows[0] });
  } catch (error) {
    res.status(404).json({ success: false, message: "data not found" });
  }
});

// get All booking
app.get("/api/booking", verifyAdmin, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM bookings");
    res
      .status(200)
      .json({ success: true, message: "Successful", data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "internal server error" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

export default app;
