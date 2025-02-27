const models = require('../models');
const { Op } = require("sequelize");
function addBlog(req, res) {
  const blog = {
    title: req.body.title,
    shortDesc: req.body.shortDesc,
    author: req.body.author,
    content: req.body.content,
    imageURL: req.body.imageURL,
    userId: req.body.userId,
    blogCategory: req.body.blogCategory,
    URLTitle: req.body.URLTitle, 
  };

  models.Blogs.create(blog)
    .then((result) => { 
      return models.Blogs.findOne({
        where: { id: result.id },
        include: [
          {
            model: models.BlogCategory,
            as: "category", 
            attributes: ["id", "category"],
          },
        ],
      });
    })
    .then((result) => {
      res.status(201).json({
        message: "Blog added successfully",
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

function editBlog(req, res) {
  const blogId = req.body.blogId;

  const updatedBlogData = {
    title: req.body.title,
    shortDesc: req.body.shortDesc,
    author: req.body.author,
    content: req.body.content,
    imageURL: req.body.imageURL,
    userId: req.body.userId,
    blogCategory: req.body.blogCategory,
    URLTitle: req.body.URLTitle, 
  };

  models.Blogs.update(updatedBlogData, { where: { id: blogId } })
    .then((result) => {
      if (result[0] > 0) {
        return models.Blogs.findOne({
          where: { id: blogId },
          include: [
            {
              model: models.BlogCategory,
              as: "category",
              attributes: ["id", "category"],
            },
          ],
        });
      } else {
        res.status(404).json({ message: "Blog not found" });
      }
    })
    .then((updatedBlog) => {
      res.status(200).json({
        message: "Blog updated successfully",
        post: updatedBlog,
      });
    })
    .catch((error) => {
      console.error("Error updating blog:", error);
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error.message,
      });
    });
}

function deleteBlog(req, res) {
    const blogId = req.body.id;

    models.Blogs.destroy({ where: { id: blogId } })
        .then(result => {
            if (result) {
                res.status(200).json({
                    message: "Blog deleted successfully"
                });
            } else {
                res.status(200).json({
                    message: "Blog not found"
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

function getblogsById(req, res) {
    const id = req.params.id;

    models.Blogs.findByPk(id).then(result => {
        res.status(200).json(result);
    }).catch(error => {
        res.status(500).json({
            message: "something went wrong, please try again later!"
        });
    });
}

function getblogs(req, res) {
    models.Blogs.findAll({
        include: [
            {
                model: models.BlogCategory,
                as: 'category',  
                attributes: ['id', 'category'] ,
                required: true,
            }
        ],
    }).then(result => {
        if (!result || result.length === 0) {
            return res.status(200).json([]);
        }
        res.status(200).json(result);
    })
    .catch(error => {
        console.error("Error fetching blogs:", error);
        res.status(500).json({
            message: "Something went wrong, please try again later!"
        });
    });
}

function getblogscategories(req, res) {
    models.BlogCategory.findAll().then(result => {
        if (!result || result.length === 0) {
            return res.status(200).json([]);
        }
        res.status(200).json(result);
    })
    .catch(error => {
        console.error("Error fetching blogs:", error);
        res.status(500).json({
            message: "Something went wrong, please try again later!"
        });
    });
}


async function searchBlogs(req, res) {
  try {
    const { query, blogCategory } = req.body;

    if (!query && !blogCategory) {
      return res.status(400).json({ message: "Either query or blogCategory is required" });
    }

    const searchConditions = {};

    if (query) {
      searchConditions[Op.or] = [
        { title: { [Op.like]: `%${query}%` } },
        { content: { [Op.like]: `%${query}%` } },
        { author: { [Op.like]: `%${query}%` } },
      ];
    }

    if (blogCategory !== null) { 
      searchConditions.blogCategory = blogCategory;
    }

    const blogs = await models.Blogs.findAll({
      where: searchConditions,
      include: [
        {
          model: models.BlogCategory,
          as: "category",
        },
      ],
    });

    return res.status(200).json(blogs);
  } catch (error) {
    console.error("Error searching blogs:", error);
    return res.status(500).json({ message: "Something went wrong. Please try again later!" });
  }
}

module.exports = {
    addBlog: addBlog,
    getblogsById : getblogsById,
    getblogs: getblogs,
    editBlog: editBlog,
    deleteBlog: deleteBlog,
    getblogscategories: getblogscategories,
    searchBlogs: searchBlogs,
}