const models = require('../models');

function addBlog(req, res) {
    const blog = {
        title: req.body.title,
        shortDesc: req.body.shortDesc,
        author: req.body.author,
        content: req.body.content,
        imageURL: req.body.imageURL,
        userId: req.body.userId
    }

    models.Blogs.create(blog).then(result => {
        res.status(201).json({
            message: "Blog added successfully",
            post: result
        });
    }).catch(error => {
        res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error
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
        userId: req.body.userId
    };

    models.Blogs.update(updatedBlogData, { where: { id: blogId } })
        .then(result => {
            if (result[0] > 0) {
                res.status(200).json({
                    message: "Blog updated successfully",
                    post: updatedBlogData
                });
            } else {
                res.status(404).json({
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

function deleteBlog(req, res) {
    const blogId = req.body.id;  // Assuming the blog ID is passed as a URL parameter

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
    models.Blogs.findAll().then(result => {
        if (!result || result.length === 0) {
            return res.status(200).json([]);
        }
        console.log(res.status(200).json(result));
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


module.exports = {
    addBlog: addBlog,
    getblogsById : getblogsById,
    getblogs: getblogs,
    editBlog: editBlog,
    deleteBlog: deleteBlog,
    getblogscategories: getblogscategories
}