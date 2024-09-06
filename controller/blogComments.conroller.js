const models = require("../models");

function addBlogComments(req, res) {
  const store = {
    ip_address: req.body.ip_address,
    fullName: req.body.fullName,
    userEmail: req.body.userEmail,
    comment: req.body.comment,
    blogId: req.body.blogId,
    status: 0,
  };

  models.Comments.create(store)
    .then((result) => {
      res.status(201).json({
        message: "Comment added successfully",
        post: result,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error,
      });
    });
}

function getBlogComments(req, res) {
  models.Comments.findAll({
    where: {
      blogId: req.body.blogId,
    },
  })
    .then((result) => {
      if (!result || result.length === 0) {
        return res.status(200).json([]);
      }
      res.status(200).json(result);
    })
    .catch((error) => {
      console.error("Error fetching blogs:", error);
      res.status(500).json({
        message: "Something went wrong, please try again later!",
      });
    });
}

function deleteBlogComment(req, res) {
  const commentId = req.body.commentId;

  models.Comments.destroy({ where: { id: commentId } })
    .then((result) => {
      if (result) {
        res.status(200).json({
          message: "Comment deleted successfully",
        });
      } else {
        res.status(200).json({
          message: "Something went wrong, please try again later!",
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

function getCommentstoApprove(req, res) {
  models.Comments.findAll({
    where: {
      blogId: req.body.blogId,
      status: 0,
    },
  })
    .then((result) => {
      if (!result || result.length === 0) {
        return res.status(200).json([]);
      }
      res.status(200).json(result);
    })
    .catch((error) => {
      console.error("Error fetching comments:", error);
      res.status(500).json({
        message: "Something went wrong, please try again later! its wrong",
      });
    });
}

module.exports = {
  addBlogComments: addBlogComments,
  getBlogComments: getBlogComments,
  getCommentstoApprove: getCommentstoApprove,
  deleteBlogComment: deleteBlogComment,
};
