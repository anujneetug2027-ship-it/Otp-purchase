console.log("🚀 Server starting");

import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import cors from "cors";
import adminRoutes from "./routes/admin.js";

const app = express();

/* ===================== CORS ===================== */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://otp-purchase-lcp2.vercel.app"
    ],
    credentials: true
  })
);

/* ===================== BODY ===================== */
app.use(express.json());

/* ===================== SESSION ===================== */
app.use(
  session({
    name: "admin-session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,      // Render = HTTPS
      sameSite: "none",  // REQUIRED for Vercel ↔ Render
      maxAge: 1000 * 60 * 60 // 1 hour
    }
  })
);

/* ===================== ROUTES ===================== */
app.get("/", (req, res) => {
  res.send("Server alive");
});

app.use("/admin", adminRoutes);

/* ===================== DATABASE ===================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) =>
    console.error("❌ MongoDB connection error:", err.message)
  );

/* ===================== SERVER ===================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("✅ Listening on port", PORT);
});
