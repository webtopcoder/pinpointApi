const Base = require("../models/Base");
const User = require("../models/User");
const Post = require("../models/Post");
const msg = require("../const/message");
const path = require("path");
const mongoose = require("mongoose");

const baseController = {
  download: async (req, res) => {
    try {
      const fileName = req.params.file;
      const type = req.body.type;
      const directoryPath = path.join(__dirname, "../public/");

      res.download(directoryPath + type + "/" + fileName, (err) => {
        if (err) {
          res.status(500).send({
            message: "Could not download the file. " + err,
          });
        }
      });
    } catch (error) {
      console.log(error);
      return res.json({ success: false, msg: msg.server.error });
    }
  },
};

module.exports = baseController;
