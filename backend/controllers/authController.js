const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

function signToken(admin) {
  return jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: String(email || "").toLowerCase() });

    if (!admin || !(await bcrypt.compare(password || "", admin.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(admin);
    res.json({
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (error) {
    next(error);
  }
};

exports.me = (req, res) => {
  res.json({ admin: req.admin });
};

exports.createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role = "admin" } = req.body;
    const hashed = await bcrypt.hash(password, 12);
    const admin = await Admin.create({ name, email, password: hashed, role });
    res.status(201).json({ id: admin._id, name: admin.name, email: admin.email, role: admin.role });
  } catch (error) {
    next(error);
  }
};
