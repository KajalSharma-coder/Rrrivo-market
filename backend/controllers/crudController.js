const { uploadSingle, uploadMany } = require("../services/cloudinaryService");

function parseBoolean(value) {
  if (value === undefined || value === null || value === "") return value;
  return value === true || value === "true" || value === "on" || value === "1";
}

function parseBody(body) {
  const data = { ...body };
  ["status", "featured", "active", "approved"].forEach((key) => {
    if (key in data) data[key] = parseBoolean(data[key]);
  });
  ["rating", "discount", "totalAmount"].forEach((key) => {
    if (data[key] !== undefined && data[key] !== "")
      data[key] = Number(data[key]);
  });
  ["gallery", "products", "socialLinks"].forEach((key) => {
    if (
      typeof data[key] === "string" &&
      (data[key].startsWith("[") || data[key].startsWith("{"))
    ) {
      try {
        data[key] = JSON.parse(data[key]);
      } catch {}
    }
  });
  return data;
}

exports.list =
  (Model, populate = "") =>
  async (req, res, next) => {
    try {
      const query = {};

      if (req.query.status === "active") query.status = true;
      if (req.query.active === "true") query.active = true;
      if (req.query.featured === "true") query.featured = true;
      if (req.query.category) query.category = req.query.category;
      if (req.query.subcategory) query.subcategory = req.query.subcategory;
      if (req.query.q) query.name = { $regex: req.query.q, $options: "i" };

      const docs = await Model.find(query)
        .populate(populate)
        .sort({ createdAt: -1 });
      res.json(docs);
    } catch (error) {
      next(error);
    }
  };

exports.getOne =
  (Model, populate = "") =>
  async (req, res, next) => {
    try {
      const doc = await Model.findById(req.params.id).populate(populate);
      if (!doc) return res.status(404).json({ message: "Record not found" });
      res.json(doc);
    } catch (error) {
      next(error);
    }
  };

exports.create = (Model, folder) => async (req, res, next) => {
  try {
    const data = parseBody(req.body);
    if (req.files?.image?.[0])
      data.image = await uploadSingle(req.files.image[0], folder);
    if (req.files?.gallery?.length)
      data.gallery = await uploadMany(req.files.gallery, `${folder}/gallery`);
    const doc = await Model.create(data);
    res.status(201).json(doc);
  } catch (error) {
    next(error);
  }
};

exports.update = (Model, folder) => async (req, res, next) => {
  try {
    const data = parseBody(req.body);
    if (req.files?.image?.[0])
      data.image = await uploadSingle(req.files.image[0], folder);
    if (req.files?.gallery?.length)
      data.gallery = await uploadMany(req.files.gallery, `${folder}/gallery`);
    const doc = await Model.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ message: "Record not found" });
    res.json(doc);
  } catch (error) {
    next(error);
  }
};

exports.remove = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Record not found" });
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    next(error);
  }
};
