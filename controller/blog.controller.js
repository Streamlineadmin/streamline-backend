const models = require('../models');

function addBlog(req, res) {
    const blog = {
        title: req.body.title,
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
    getblogs: getblogs
}