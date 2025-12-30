console.log("🚀 Server starting");

import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import cors from "cors";

import adminRoutes from "./routes/admin.js";
import botRoutes from "./routes/bot.js"; // ✅ BOT ROUTES

const app = express();

/* =====================================================
   REQUIRED FOR RENDER (SECURE COOKIES BEHIND PROXY)
===================================================== */
app.set("trust proxy", 1);

/* =====================================================
   CORS (ALLOW VERCEL FRONTEND + COOKIES)
===================================================== */
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

/* =====================================================
   BODY PARSER
===================================================== */
app.use(express.json());

/* =====================================================
   SESSION CONFIG
===================================================== */
app.use(
  session({
    name: "admin-session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,     // HTTPS (Render)
      sameSite: "none", // Required for cross-site cookies
      maxAge: 1000 * 60 * 60 // 1 hour
    }
  })
);

/* =====================================================
   ROUTES
===================================================== */
app.get("/", (req, res) => {
  res.send("Server alive");
});

/* Admin panel routes */
app.use("/admin", adminRoutes);

/* Telegram bot routes */
app.use("/bot", botRoutes);

/* =====================================================
   DATABASE
===================================================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) =>
    console.error("❌ MongoDB connection error:", err.message)
  );

/* =====================================================
   SERVER START
===================================================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
