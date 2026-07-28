const mongoose = require("mongoose");

const dns = require("dns");

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  // If Node is configured to use a loopback DNS resolver that refuses SRV
  // queries, switch to public DNS servers so mongodb+srv works.
  try {
    const servers = dns.getServers ? dns.getServers() : [];
    if (
      servers.some((server) => server.startsWith("127.") || server === "::1")
    ) {
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

    // If a fallback URI is configured, use it only for development.
    const isAtlasSrv = String(uri).startsWith("mongodb+srv:");
    const localFallback = process.env.LOCAL_MONGODB_URI;

    if (
      isAtlasSrv &&
      process.env.NODE_ENV !== "production" &&
      localFallback
    ) {
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
