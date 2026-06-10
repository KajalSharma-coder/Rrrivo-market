const fs = require("fs/promises");
const path = require("path");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");

const rootDir = path.resolve(__dirname, "..", "..");
const localUploadRoot = path.join(rootDir, "frontend", "uploads");

function hasCloudinaryConfig() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function extensionFor(file) {
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (/^\.[a-z0-9]+$/.test(ext)) return ext;
  const subtype = String(file.mimetype || "").split("/")[1] || "jpg";
  return `.${subtype.replace(/[^a-z0-9]/gi, "") || "jpg"}`;
}

async function saveLocal(file, folder) {
  const safeFolder = String(folder || "uploads")
    .split("/")
    .map((part) => part.replace(/[^a-z0-9_-]/gi, ""))
    .filter(Boolean)
    .join(path.sep);
  const uploadDir = path.join(localUploadRoot, safeFolder);
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extensionFor(file)}`;

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), file.buffer);

  return `/uploads/${safeFolder.split(path.sep).join("/")}/${filename}`;
}

function uploadBuffer(file, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
}

async function uploadSingle(file, folder) {
  if (!file) return undefined;
  if (!hasCloudinaryConfig()) return saveLocal(file, folder);
  return uploadBuffer(file, folder);
}

async function uploadMany(files = [], folder) {
  if (!hasCloudinaryConfig()) return Promise.all(files.map((file) => saveLocal(file, folder)));
  return Promise.all(files.map((file) => uploadBuffer(file, folder)));
}

module.exports = { uploadSingle, uploadMany };
