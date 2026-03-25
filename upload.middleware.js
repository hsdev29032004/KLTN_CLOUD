const multer = require("multer");
const path = require("path");

const upload = multer({
  dest: path.join(__dirname, "uploads"),
  limits: {
    fileSize: 1024 * 1024 * 500, // 500MB
  },
});

module.exports = upload;
