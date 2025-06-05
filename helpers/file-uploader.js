const multer = require('multer');
const path = require('path');

// Define the storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');  // Specify the directory to save the files
    },
    filename: (req, file, cb) => {
        // Save the file with a unique name (timestamp + original extension)
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// File filter allowing all types of files
const fileFilter = (req, file, cb) => {
    cb(null, true);  // Accept all file types
};

// Set up multer with storage, file size limits, and file filter
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10  // Limit file size to 10MB
    },
    fileFilter: fileFilter  // Accept all file types
});

module.exports = {
    upload
};
