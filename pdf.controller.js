const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");

const PDF_DIR = path.join(__dirname, "pdf");

if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });

// ─── Multer config (PDF only, 50 MB) ───────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PDF_DIR),
  filename: (_req, _file, cb) => {
    const lessonId = "lesson-" + uuidv4();
    cb(null, lessonId + ".pdf");
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

exports.uploadPdfMiddleware = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 50 }, // 50 MB
  fileFilter,
}).single("pdf");

// ─── Upload handler ─────────────────────────────────────────────────────────
exports.uploadPdf = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Missing PDF file" });
  }

  // filename already contains the lessonId (e.g. "lesson-<uuid>.pdf")
  const lessonId = path.basename(req.file.filename, ".pdf");

  return res.status(201).json({
    lessonId,
    url: `/api/pdfs/${lessonId}`,
  });
};

// ─── Serve handler ──────────────────────────────────────────────────────────
exports.servePdf = (req, res) => {
  const { lessonId } = req.params;

  // Basic path traversal guard
  const safeName = path.basename(lessonId);
  let filePath = path.join(PDF_DIR, safeName + ".pdf");

  if (!fs.existsSync(filePath)) {
    const fallback = path.join(PDF_DIR, "test.pdf");
    if (fs.existsSync(fallback)) {
      console.warn(
        `PDF not found for lessonId "${lessonId}", serving test fallback`
      );
      filePath = fallback;
    } else {
      return res.status(404).json({ message: "PDF not found" });
    }
  }

  const stat = fs.statSync(filePath);

  res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Length": stat.size,
    "Content-Disposition": `inline; filename="${path.basename(filePath)}"`,
    "Accept-Ranges": "bytes",
  });

  fs.createReadStream(filePath).pipe(res);
};
