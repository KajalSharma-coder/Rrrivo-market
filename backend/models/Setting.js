const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  storeName: { type: String, default: "Rrrivo Global Trade" },
  contactNumber: { type: String, default: "+91 9636984162" },
  email: { type: String, default: "" },
  address: { type: String, default: "Gajanand Mall, Sheopur Road, Pratap Nagar, Jaipur, Rajasthan 302033" },
  socialLinks: {
    facebook: { type: String, default: "#" },
    instagram: { type: String, default: "#" },
    x: { type: String, default: "#" },
    linkedin: { type: String, default: "#" }
  },
  footerContent: { type: String, default: "Premium farm products delivered fresh from growers to your home." },
  aboutUsContent: { type: String, default: "Rrrivo Global Trade supports buyers with transparent sourcing, practical market coordination, quality checks, and quick dispatch communication." }
}, { timestamps: true });

module.exports = mongoose.model("Setting", settingSchema);
