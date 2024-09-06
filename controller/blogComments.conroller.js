const models = require("../models");

function addBlogComments(req, res) {
  const comments = {
    blogId: req.body.blogId,
    fullName: req.body.fullName,
    userEmail: req.body.userEmail,
    comment: req.body.comment,
    ip_address: req.body.ip_address,
    status: 0,
  };

  models.Comments.create(comments)
    .then((result) => {
      res.status(200).json({
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

function getApprovedBlogComments(req, res) {
  models.Comments.findAll({
    where: {
      blogId: req.body.blogId,
      status: 1
    },
  })
    .then((result) => {
      if (!result || result.length === 0) {
        return res.status(200).json([]);
      }
      res.status(200).json(result);
    })
    .catch((error) => {
      console.error("Error fetching blog comments:", error);
      res.status(500).json({
        message: "Something went wrong, please try again later!",
      });
    });
}

function approveBlogComments(req, res) {
  const commentId = req.body.commentId;

  const commentData = {
    status: 1
  };

  models.Comments.update(commentData, { where: { id: commentId } })
    .then(result => {
      if (result[0] > 0) {
        res.status(200).json({
          message: "Comment approved successfully",
          post: {
            commentId: commenntId,
            status: 1
          }
        });
      } else {
        res.status(200).json({
          message: "Comment not found"
        });
      }
    })
    .catch(error => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error
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
        res.status(500).json({
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
  getApprovedBlogComments: getApprovedBlogComments,
  getCommentstoApprove: getCommentstoApprove,
  deleteBlogComment: deleteBlogComment,
  approveBlogComments: approveBlogComments
};
