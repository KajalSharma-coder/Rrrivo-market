require("dotenv").config();
const connectDB = require("./config/db");

(async () => {
  try {
    await connectDB();
    console.log("DB connection successful");
    process.exit(0);
  } catch (err) {
    console.error("DB connection failed:", err.message || err);
    process.exit(1);
  }
})();
