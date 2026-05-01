const multer = require("multer");

const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowedImageTypes = [
    "image/png",
    "image/jpg",
    "image/jpeg",
    "image/webp",
  ];
  if (allowedImageTypes.includes(file.mimetype)) {
    return cb(null, true);
  }
  return cb(new Error("Only images (PNG, JPG, JPEG, WEBP) are allowed"), false);
};

const csvFilter = (req, file, cb) => {
  const allowedCsvTypes = ["text/csv", "application/vnd.ms-excel"];
  if (
    allowedCsvTypes.includes(file.mimetype) ||
    file.originalname.endsWith(".csv")
  ) {
    return cb(null, true);
  }
  return cb(new Error("Only CSV files are allowed"), false);
};

const uploadImage = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const uploadCSV = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: csvFilter,
});

module.exports = { uploadImage, uploadCSV };
