const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  discount: { type: Number, default: 0, min: 0 },
  image: { type: String, default: "" },
  startDate: Date,
  endDate: Date,
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Offer", offerSchema);
