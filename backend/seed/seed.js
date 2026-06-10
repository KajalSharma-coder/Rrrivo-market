require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const ensureSeedAdmin = require("../utils/ensureSeedAdmin");

async function seedAdmin() {
  await connectDB();
  await ensureSeedAdmin();
}

seedAdmin()
  .then(() => mongoose.connection.close())
  .catch(async (error) => {
    console.error(error);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  });
