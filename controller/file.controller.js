function upload(req, res) {
    if (req.file) {
        res.status(201).json({
            message: "File uploaded successfully",
            url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
        });
    } else {
        res.status(400).json({
            message: "No file uploaded. Please try again!"
        });
    }
}

module.exports = {
    upload: upload
};
