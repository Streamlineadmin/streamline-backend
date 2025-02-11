const models = require("../models");

function updateImage(req, res) {
  if (!req.body.imageUrl) {
    return res.status(400).json({ message: "Image URL is required" });
  }

  const imageData = {
    userId: req.body.userId,
    imageUrl: req.body.imageUrl,
  };

  models.Users.findOne({
    where: { imageUrl: imageData.imageUrl, userId: imageData.userId },
  })
    .then((existingImage) => {
      if (existingImage) {
        return res.status(409).json({ message: "Image already uploaded" });
      } else {
        models.Users.create(imageData)
          .then((result) => {
            res.status(201).json({
              message: "Image uploaded successfully",
              image: result,
            });
          })
          .catch((error) => {
            res.status(500).json({
              message: "Something went wrong, please try again later!",
              error: error,
            });
          });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error,
      });
    });
}

module.exports = { updateImage: updateImage };
