import express from "express";
import Coupon from "../models/Coupon.js";
import BotUser from "../models/BotUser.js";

const router = express.Router();

/* Validate coupon */
router.post("/validate-coupon", async (req, res) => {
  const { telegramId, name, coupon } = req.body;

  if (!telegramId || !coupon) {
    return res.status(400).json({ error: "Missing data" });
  }

  const validCoupon = await Coupon.findOne({ code: coupon });

  if (!validCoupon) {
    return res.status(401).json({ error: "Invalid coupon" });
  }

  await BotUser.findOneAndUpdate(
    { telegramId },
    { telegramId, name, usedCoupon: coupon },
    { upsert: true }
  );

  res.json({ success: true });
});

export default router;
