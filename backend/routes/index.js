const express = require("express");
const resourceRouter = require("./resourceRoutes");
const authRoutes = require("./authRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const orderRoutes = require("./orderRoutes");
const settingsRoutes = require("./settingsRoutes");

const Product = require("../models/Product");
const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");
const Banner = require("../models/Banner");
const Offer = require("../models/Offer");
const User = require("../models/User");
const Review = require("../models/Review");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/products", resourceRouter(Product, { populate: "category subcategory", folder: "products" }));
router.use("/categories", resourceRouter(Category, { folder: "categories" }));
router.use("/subcategories", resourceRouter(Subcategory, { populate: "categoryId", folder: "subcategories" }));
router.use("/banners", resourceRouter(Banner, { folder: "banners" }));
router.use("/offers", resourceRouter(Offer, { folder: "offers" }));
router.use("/orders", orderRoutes);
router.use("/users", resourceRouter(User));
router.use("/reviews", resourceRouter(Review, { populate: "productId userId" }));
router.use("/settings", settingsRoutes);

module.exports = router;
