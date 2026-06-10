const mongoose = require("mongoose");

const orderProductSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: String,
  quantity: { type: Number, default: 1 },
  price: { type: Number, default: 0 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  products: [orderProductSchema],
  totalAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  orderStatus: {
    type: String,
    enum: ["pending", "accepted", "rejected", "processing", "shipped", "delivered"],
    default: "pending"
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);
