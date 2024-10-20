function upload(req, res) {
    if (req.file && req.file.filename) {
        res.status(201).json({
            message: "File uploaded successfully",
            url: req.file.filename // Returns the file name or path
        });
    } else {
        res.status(500).json({
            message: "Something went wrong, please try again!"
        });
    }
}

module.exports = {
    upload: upload
};
