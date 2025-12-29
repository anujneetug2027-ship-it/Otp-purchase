import express from "express";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import Coupon from "../models/Coupon.js";
import { isAuth } from "../middleware/auth.js";

const router = express.Router();

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    req.session.admin = admin._id;
    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =============== CREATE COUPON =============== */
router.post("/coupon", isAuth, async (req, res) => {
  try {
    const { code } = req.body;

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
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
