import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import cors from "cors";

import adminRoutes from "./routes/admin.js";
import "./routes/bot.js"; // ✅ START TELEGRAM BOT (NO EXPORT)

const app = express();

/* REQUIRED FOR RENDER */
app.set("trust proxy", 1);

/* CORS */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://otp-purchase-lcp2.vercel.app"
    ],
    credentials: true
  })
);

app.use(express.json());

/* SESSION */
app.use(
  session({
    name: "admin-session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      sameSite: "none"
    }
  })
);

/* ADMIN ROUTES */
app.use("/admin", adminRoutes);

/* HEALTH CHECK */
app.get("/", (req, res) => {
  res.send("Server running");
});

/* DB */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(console.error);

/* START */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
