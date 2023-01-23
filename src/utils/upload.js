const cloudinary = require("cloudinary");
const config = require("@configs/config");
const uuid = require("uuid");
const logger = require("@configs/logger");

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const uploadImage = (file) => {
  const fileName = uuid.v4();
  const path = file.path;

  cloudinary.v2.uploader.upload(
    path,
    {
      public_id: fileName,
      resource_type: "auto",
    },
    (err, result) => {
      if (err) {
        throw err;
      }
      return result;
    }
  );
};

const uploadImages = async (files) => {
  try {
    const promises = files.map(async (file) => {
      const { secure_url, public_id } = await cloudinary.v2.uploader.upload(
        file.path,
        {
          public_id: `${uuid.v4()}`,
          resource_type: "auto",
        }
      );
      return { secure_url, public_id };
    });
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    logger.error(error);
  }
};

const deleteImage = async (public_id) => {
  try {
    await cloudinary.v2.uploader.destroy(public_id);
  } catch (error) {
    logger.error(error);
  }
};

module.exports = {
  uploadImage,
  uploadImages,
  deleteImage,
};
