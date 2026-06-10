const express = require("express");
const Order = require("../models/Order");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const crud = require("../controllers/crudController");

const router = express.Router();

router.get("/", protect, crud.list(Order, "userId products.productId"));
router.get("/:id", protect, crud.getOne(Order, "userId products.productId"));
router.post("/", async (req, res, next) => {
  try {
    const { customer = {}, products = [], totalAmount = 0 } = req.body;
    let user = null;

    if (customer.mobile) {
      user = await User.findOneAndUpdate(
        { mobile: customer.mobile },
        customer,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const order = await Order.create({
      userId: user?._id,
      products,
      totalAmount,
      paymentStatus: "pending",
      orderStatus: "pending"
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});
router.put("/:id", protect, crud.update(Order));

module.exports = router;
