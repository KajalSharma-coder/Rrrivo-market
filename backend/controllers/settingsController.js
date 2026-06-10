const Setting = require("../models/Setting");

async function getSettingsDoc() {
  let settings = await Setting.findOne();
  if (!settings) settings = await Setting.create({});
  return settings;
}

exports.getSettings = async (req, res, next) => {
  try {
    res.json(await getSettingsDoc());
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const settings = await getSettingsDoc();
    const data = { ...req.body };
    if (typeof data.socialLinks === "string") data.socialLinks = JSON.parse(data.socialLinks);
    Object.assign(settings, data);
    await settings.save();
    res.json(settings);
  } catch (error) {
    next(error);
  }
};
