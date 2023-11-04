const path = require("path");
const multer = require("multer");

const fileFilter = (req, file, cb) => {
  const parsedPath = path.parse(file.originalname);
  const ext = parsedPath.ext;
  const allowedExt = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".ico",
    ".mp4",
    ".m4v",
    ".mov",
    ".wmv",
    ".avi",
    ".mpg",
    ".ogv",
    ".3gp",
    ".3g2",
    ".pdf",
    ".doc",
    ".ppt",
    ".pptx",
    ".pps",
    ".ppsx",
    ".odt",
    ".xls",
    ".xlsx",
    ".psd",
    ".mp3",
    ".m4a",
    ".ogg",
    ".wav",
  ];
  if (!allowedExt.includes(ext.toLowerCase())) {
    cb(new Error("File type is not supported"), false);
    return;
  }

  cb(null, true);
};

// const upload = multer({
//   storage: multer.diskStorage({
//     destination: "./public/avatar",
//     filename: (req, file, callBack) => {
//       console.log(234234, req)
//       const parsedPath = path.parse(file.originalname);
//       const ext = parsedPath.ext;
//       const fileName = `${parsedPath.name.replace(/\s/g, "")}-${Date.now()}-${ext}`;
//       callBack(null, fileName);
//     },
//   }),
//   limits: {},
//   fileFilter,
// });

const uploadAdmin = multer({

  storage: multer.diskStorage({
    destination: "./public/avatar",
    filename: (req, file, callBack) => {
      const parsedPath = path.parse(file.originalname);
      const ext = (parsedPath.ext).toLowerCase();
      const fileName = `${parsedPath.name.replace(/\s/g, "")}-${Date.now()}-${req.user._id
        }${ext}`;
      callBack(null, fileName);
    },
  }),
  limits: {},
  fileFilter,
});

// module.exports = upload;
module.exports = uploadAdmin;
