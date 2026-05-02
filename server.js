const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const auth = require("./auth.middleware");
const { streamVideo } = require("./video.controller");
const { createVideo } = require("./upload.controller");
const upload = require("./upload.middleware");
const { uploadPdf, uploadPdfMiddleware, servePdf } = require("./pdf.controller");

const app = express();

// Cấu hình CORS cho phép frontend truy cập API và gửi cookie
app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-url",
    "x-encrypt-url",
  ]
}));

// Ensure preflight requests are handled
app.options('*', cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-url",
    "x-encrypt-url",
  ]
}));

// simple request logger to help debugging
app.use((req, res, next) => {
  console.log(req.method, req.path);
  next();
});

app.use(cookieParser());

// tạo video (chỉ admin / giảng viên)
app.post(
  "/api/videos",
  auth,
  upload.single("video"),
  createVideo
);

// stream video
app.get(
  "/api/videos/:lessonId/:filename",
  auth,
  streamVideo
);

// upload PDF (chỉ admin / giảng viên)
app.post(
  "/api/pdfs",
  auth,
  uploadPdfMiddleware,
  uploadPdf
);

// serve PDF
app.get(
  "/api/pdfs/:lessonId",
  auth,
  servePdf
);

app.listen(3002, () => {
  console.log("Video server running on http://localhost:3002");
});
