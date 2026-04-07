const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subdir = req.uploadSubdir || 'misc';
    const dir = path.join(process.env.UPLOAD_DIR || 'uploads', subdir);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${uuidv4()}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (allowed) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} not allowed. Allowed: ${allowed.join(', ')}`));
  }
};

const maxSize = () => (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;

const uploadImage = multer({
  storage,
  limits: { fileSize: maxSize() },
  fileFilter: fileFilter(['.jpg', '.jpeg', '.png', '.webp']),
});

const uploadDocument = multer({
  storage,
  limits: { fileSize: maxSize() },
  fileFilter: fileFilter(['.pdf', '.jpg', '.jpeg', '.png']),
});

const uploadAny = multer({
  storage,
  limits: { fileSize: maxSize() },
  fileFilter: fileFilter(['.pdf', '.jpg', '.jpeg', '.png', '.webp']),
});

module.exports = { uploadImage, uploadDocument, uploadAny };
