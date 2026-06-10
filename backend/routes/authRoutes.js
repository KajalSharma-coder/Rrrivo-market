const express = require("express");
const { body } = require("express-validator");
const { login, me, createAdmin } = require("../controllers/authController");
const { protect, allowRoles } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

router.post("/login", [
  body("email").isEmail(),
  body("password").isLength({ min: 6 })
], validate, login);

router.get("/me", protect, me);
router.post("/admins", protect, allowRoles("superadmin"), [
  body("name").notEmpty(),
  body("email").isEmail(),
  body("password").isLength({ min: 8 })
], validate, createAdmin);

module.exports = router;
