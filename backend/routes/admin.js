import express from "express";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import Coupon from "../models/Coupon.js";
import { isAuth } from "../middleware/auth.js";

const router = express.Router();

/* =====================================================
   TEMPORARY: CREATE ADMIN (REMOVE AFTER SUCCESS)
   ===================================================== */
router.post("/create-admin", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // prevent duplicate admin
    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({
      name,
      email,
      password: hashedPassword
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Create admin error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =====================================================
   ADMIN LOGIN
   ===================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // store admin id in session
    req.session.admin = admin._id;

    res.json({ success: true });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =====================================================
   CREATE COUPON (PROTECTED)
   ===================================================== */
router.post("/coupon", isAuth, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Coupon code required" });
    }

    const exists = await Coupon.findOne({ couponCode: code });
    if (exists) {
      return res.status(400).json({ error: "Coupon already exists" });
    }

    await Coupon.create({
      couponCode: code,
      generatedBy: "Anuj"
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Coupon error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
