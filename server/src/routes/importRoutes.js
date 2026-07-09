const express = require('express');
const multer = require('multer');
const { uploadCSV, processCSV } = require('../controllers/importController');

const router = express.Router();

// Configure multer for CSV file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept CSV files
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.toLowerCase().endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
});

// Upload and parse CSV for preview
router.post('/upload', upload.single('file'), uploadCSV);

// Process records with AI
router.post('/process', processCSV);

module.exports = router;
