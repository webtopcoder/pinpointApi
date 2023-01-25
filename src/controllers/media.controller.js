const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { mediaService } = require("@services");
const path = require("path");

const getMedia = catchAsync(async (req, res) => {
  const { mediaId } = req.params;
  const media = await mediaService.getMediaById(mediaId);
  if (!media) {
    throw new ApiError(httpStatus.NOT_FOUND, "Media not found");
  }

  if (!media.isPublic && req.user?._id != media.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Media is private");
  }

  return res.status(httpStatus.OK).sendFile(media.filepath, {
    root: "./public/avatar/",
  });
});

const uploadMedia = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No file uploaded");
  }
  const { isPublic } = req.body;
  const media = await mediaService.uploadMedia(
    req.file,
    req.user._id,
    isPublic
  );
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  return res.status(httpStatus.CREATED).send(media);
});

const download = catchAsync(async (req, res) => {
  const { file } = req.params;
  const directoryPath = path.join(__dirname, "../../public/avatar/");

  res.download(directoryPath + file, (err) => {
    if (err) {
      res.status(500).send({
        message: "Could not download the file. " + err,
      });
    }
  });
});

module.exports = {
  getMedia,
  uploadMedia,
  download,
};
