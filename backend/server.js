require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const xss = require("xss-clean");
const connectDB = require("./config/db");
const apiRoutes = require("./routes");
const ensureSeedAdmin = require("./utils/ensureSeedAdmin");

const app = express();
const port = process.env.PORT || 5000;
const rootDir = path.resolve(__dirname, "..");
const uploadsDir = path.join(rootDir, "uploads");
const legacyUploadsDir = path.join(rootDir, "frontend", "uploads");
const uploadRoots = [uploadsDir, legacyUploadsDir];
const defaultClientOrigins = [
  "https://rrrivo360.in",
  "https://www.rrrivo360.in",
  "https://rrrivo360.com",
  "https://www.rrrivo360.com",
  "https://rrrivo-market-2.onrender.com",
];
const envClientOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.CLIENT_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];
const allowedOrigins = new Set([...defaultClientOrigins, ...envClientOrigins]);
const apiBaseUrl = (
  process.env.VITE_API_URL ||
  process.env.API_URL ||
  "/api"
).replace(/\/$/, "");

function sendUploadFile(req, res, next) {
  let requestedPath;

  try {
    requestedPath = path.normalize(decodeURIComponent(req.path)).replace(/^(\.\.[/\\])+/, "");
  } catch {
    return res.status(400).json({ message: "Invalid upload path" });
  }

  if (requestedPath.includes("..")) {
    return res.status(400).json({ message: "Invalid upload path" });
  }

  const candidates = uploadRoots.map((dir) => path.join(dir, requestedPath));
  let index = 0;

  function tryNext() {
    const filePath = candidates[index];
    index += 1;

    if (!filePath) {
      return res.status(404).json({ message: "Upload not found" });
    }

    fs.stat(filePath, (error, stats) => {
      if (error || !stats.isFile()) return tryNext();
      return res.sendFile(filePath, {
        maxAge: process.env.NODE_ENV === "production" ? "7d" : 0,
      });
    });
  }

  tryNext();
}

app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(xss());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", sendUploadFile);
app.use("/api", apiRoutes);
app.get("/config.js", (req, res) => {
  res.type("application/javascript").send(
    `window.RRRIVO_API_BASE=${JSON.stringify(apiBaseUrl)};`,
  );
});
app.use("/admin", express.static(path.join(rootDir, "admin")));
app.use(express.static(path.join(rootDir, "frontend")));

app.get("/admin/*", (req, res) => {
  res.sendFile(path.join(rootDir, "admin", "index.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(rootDir, "frontend", "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Server error" });
});

connectDB()
  .then(async () => {
    await ensureSeedAdmin();

    const server = app.listen(port, () =>
      console.log(
        `Server running on port ${port}. Uploads served from ${uploadsDir}`,
      ),
    );

    server.on("error", (err) => {
      console.error(err);
      if (err && err.code === "EADDRINUSE") {
        console.error(
          `Port ${port} is already in use. Stop the process using it or set a different PORT in your .env.`,
        );
        process.exit(1);
      }
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
