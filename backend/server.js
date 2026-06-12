require("dotenv").config();

const path = require("path");
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

app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(xss());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    fallthrough: true,
    maxAge: process.env.NODE_ENV === "production" ? "7d" : 0,
  }),
);
app.use(
  "/uploads",
  express.static(legacyUploadsDir, {
    fallthrough: true,
    maxAge: process.env.NODE_ENV === "production" ? "7d" : 0,
  }),
);
app.use("/api", apiRoutes);
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
