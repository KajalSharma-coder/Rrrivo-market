const express = require("express");
const crud = require("../controllers/crudController");
const upload = require("../middleware/upload");
const { protect } = require("../middleware/auth");

function resourceRouter(Model, options = {}) {
  const router = express.Router();
  const fields = upload.fields([
    { name: "image", maxCount: 1 },
    { name: "gallery", maxCount: 8 }
  ]);

  router.get("/", crud.list(Model, options.populate || ""));
  router.get("/:id", crud.getOne(Model, options.populate || ""));
  router.post("/", protect, fields, crud.create(Model, options.folder || Model.modelName.toLowerCase()));
  router.put("/:id", protect, fields, crud.update(Model, options.folder || Model.modelName.toLowerCase()));
  router.delete("/:id", protect, crud.remove(Model));

  return router;
}

module.exports = resourceRouter;
