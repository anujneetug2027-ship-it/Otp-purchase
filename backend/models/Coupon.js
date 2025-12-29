import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  couponCode: { type: String, unique: true },
  generatedBy: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  isUsed: {
    type: Boolean,
    default: false
  }
});

export default mongoose.model("Coupon", couponSchema);
