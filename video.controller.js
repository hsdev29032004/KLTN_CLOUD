const fs = require("fs");
const path = require("path");
const mime = require("mime-types");

const VIDEO_ROOT = path.join(__dirname, "videos");

exports.streamVideo = (req, res) => {
  const { lessonId, filename } = req.params;

  // 🔐 ví dụ check quyền (mock)
  // if (!req.user || !req.user.userId) {
  //   return res.status(403).end();
  // }

  const filePath = path.join(VIDEO_ROOT, lessonId, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).end();
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const contentType =
    mime.lookup(filePath) || "application/octet-stream";

  // HLS segment / m3u8 đều xử lý giống nhau
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1]
      ? parseInt(parts[1], 10)
      : fileSize - 1;

    const chunkSize = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": contentType,
    });

    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": contentType,
    });

    fs.createReadStream(filePath).pipe(res);
  }
};
