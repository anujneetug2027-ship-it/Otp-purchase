
import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true, // 🔥 AUTO FIX CASE ISSUE
    trim: true
  },
  used: {
    type: Boolean,
    default: false
  },
  usedBy: {
    type: String,
    default: null
  },
  usedAt: {
    type: Date,
    default: null
  }
});

export default mongoose.model("Coupon", couponSchema);
