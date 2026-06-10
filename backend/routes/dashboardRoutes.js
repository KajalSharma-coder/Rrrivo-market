const express = require("express");
const { analytics } = require("../controllers/dashboardController");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.get("/analytics", protect, analytics);

module.exports = router;
