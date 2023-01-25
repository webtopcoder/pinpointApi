const path = require("path");
const multer = require("multer");

const fileFilter = (req, file, cb) => {
  const parsedPath = path.parse(file.originalname);
  const ext = parsedPath.ext;
  if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
    cb(new Error("File type is not supported"), false);
    return;
  }

  cb(null, true);
};

const upload = multer({
  storage: multer.diskStorage({
    destination: "./public/avatar",
    filename: (req, file, callBack) => {
      const parsedPath = path.parse(file.originalname);
      const ext = parsedPath.ext;

      const fileName = `${parsedPath.name.replace(/\s/g, "")}-${Date.now()}-${
        req.user._id
      }${ext}`;
      callBack(null, fileName);
    },
  }),
  limits: {},
  fileFilter,
});

module.exports = upload;
