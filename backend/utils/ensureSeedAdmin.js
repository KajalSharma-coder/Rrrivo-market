const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

async function ensureSeedAdmin() {
  const name = process.env.ADMIN_SEED_NAME || "Admin";
  const email = (process.env.ADMIN_SEED_EMAIL || "admin@example.com").toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD || "ChangeMe123!";

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required before creating an admin user");
  }

  const hashed = await bcrypt.hash(password, 12);
  const admin = await Admin.findOneAndUpdate(
    { email },
    { name, email, password: hashed, role: "superadmin" },
    { new: true, upsert: true, runValidators: true },
  );

  console.log(`Admin ready: ${admin.email}`);
  return admin;
}

module.exports = ensureSeedAdmin;
