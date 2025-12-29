console.log("🚀 Server starting");

import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import cors from "cors";
import adminRoutes from "./routes/admin.js";

const app = express();

/* ---------- MIDDLEWARE ---------- */
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

/* ---------- ROUTES ---------- */
app.get("/", (req, res) => {
  res.send("Server alive");
});

app.use("/admin", adminRoutes);

/* ---------- DATABASE ---------- */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err.message));

/* ---------- SERVER ---------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("✅ Listening on port", PORT);
});
