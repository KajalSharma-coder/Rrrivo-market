const mongoose = require("mongoose");

const dns = require("dns");

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  // If Node is configured to use a localhost DNS resolver (e.g. 127.0.0.1)
  // that refuses SRV queries, switch to public DNS servers so mongodb+srv works.
  try {
    const servers = dns.getServers ? dns.getServers() : [];
    if (servers.includes("127.0.0.1") || servers.includes("::1")) {
      dns.setServers(["8.8.8.8", "8.8.4.4"]);
      console.log("Switched Node DNS servers to Google DNS for SRV resolution");
    }
  } catch (e) {
    // ignore failures and continue
  }

  const uri = process.env.MONGODB_URI;

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
    return;
  } catch (err) {
    console.warn("Primary MongoDB connection failed:", err.message);

    // If the configured URI is a mongodb+srv Atlas URI, attempt a local fallback for development.
    const isAtlasSrv = String(uri).startsWith("mongodb+srv:");
    const localFallback =
      process.env.LOCAL_MONGODB_URI || "mongodb://127.0.0.1:27017/rrrivo";

    if (isAtlasSrv) {
      console.log(`Attempting local fallback MongoDB at ${localFallback}`);
      try {
        await mongoose.connect(localFallback);
        console.log("MongoDB connected (local fallback)");
        return;
      } catch (err2) {
        console.error("Local fallback connection failed:", err2.message);
        // rethrow original error to preserve context
        throw err;
      }
    }

    // No fallback available, rethrow the original error
    throw err;
  }
}

module.exports = connectDB;
