const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const User = require("../models/User");
const Offer = require("../models/Offer");

exports.analytics = async (req, res, next) => {
  try {
    const [
      totalProducts,
      totalCategories,
      totalOrders,
      totalUsers,
      activeOffers,
      revenue,
    ] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Order.countDocuments(),
      User.countDocuments(),
      Offer.countDocuments({ active: true }),
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    const monthlyOrders = await Order.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalProducts,
      totalCategories,
      totalOrders,
      totalRevenue: revenue[0]?.total || 0,
      totalUsers,
      activeOffers,
      monthlyOrders,
    });
  } catch (error) {
    next(error);
  }
};
