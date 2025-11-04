const Setting = require('../models/setting.model');

const getSetting = async (key, defaultValue = null) => {
  const s = await Setting.findOne({ key }).lean();
  if (!s) return defaultValue;
  return s.value;
};

const setSetting = async (key, value) => {
  const upsert = await Setting.findOneAndUpdate({ key }, { value }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
  return upsert;
};

module.exports = { getSetting, setSetting };
