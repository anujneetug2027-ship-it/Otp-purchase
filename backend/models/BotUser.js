import mongoose from "mongoose";

const botUserSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true },
  name: String,
  usedCoupon: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("BotUser", botUserSchema);
