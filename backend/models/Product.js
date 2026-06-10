const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: "Subcategory" },
  image: { type: String, default: "" },
  gallery: [{ type: String }],
  rating: { type: Number, default: 4.5, min: 0, max: 5 },
  featured: { type: Boolean, default: false },
  status: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Product", productSchema);
