const models = require("../models");

function addBlogComments(req, res) {
  const store = {
    // companyId: req.body.companyId,
    ip_address: req.body.ip_address,
    fullName: req.body.fullName,
    userEmail: req.body.userEmail,
    userComment: req.body.userComment,
    blogId:req.body.blogId,
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

// not requiree 
function editBlogComment(req, res) {
  const commentId = req.body.commentId;

  const updatedCommentData = {
    companyId: req.body.companyId,
    ip_address: req.body.ip_address,
    userName: req.body.userName,
    userEmail: req.body.userEmail,
    userComment: req.body.userComment,
    status: req.body.status || 1,
  };

  models.Comments.update(updatedCommentData, { where: { id: commentId } })
    .then((result) => {
      if (result[0] > 0) {
        res.status(200).json({
          message: "Comment updated successfully",
          post: updatedCommentData,
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

// not requ 
function getBlogCommentById(req, res) {
  // which id?
  const id = req.params.id;

  models.Comments.findByPk(id)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((error) => {
      res.status(500).json({
        message: "something went wrong, please try again later!",
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
      console.error("Error fetching comments:", error);
      res.status(500).json({
        message: "Something went wrong, please try again later! its wrong",
      });
    });
}

module.exports = {
  addBlogComments: addBlogComments,
  getBlogComments: getBlogComments,
  getBlogCommentById: getBlogCommentById,
  editBlogComment: editBlogComment,
  deleteBlogComment: deleteBlogComment,
};
