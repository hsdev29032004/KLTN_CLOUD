const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);

const UPLOAD_DIR = path.join(__dirname, "uploads");
const VIDEO_DIR = path.join(__dirname, "videos");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR);

exports.createVideo = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "Missing file" });

    const lessonId = "lesson-" + uuidv4();
    const outputDir = path.join(VIDEO_DIR, lessonId);

    fs.mkdirSync(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, "index.m3u8");

    ffmpeg(file.path)
      .outputOptions([
        "-hls_time 6",
        "-hls_list_size 0",
        "-hls_segment_filename",
        path.join(outputDir, "%d.ts"),
      ])
      .output(outputPath)
      .on("end", () => {
        fs.unlinkSync(file.path); // xóa file gốc

        res.json({
          lessonId,
          hls: `/api/videos/${lessonId}/index.m3u8`,
        });
      })
      .on("error", (err) => {
        console.error(err);
        res.status(500).json({ message: "Encode failed" });
      })
      .run();
  } catch (err) {
    res.status(500).json({ message: "Upload error" });
  }
};
