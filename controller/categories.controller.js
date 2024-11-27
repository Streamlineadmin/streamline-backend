const models = require("../models");

async function getCategories(req, res) {
    const { companyId } = req.body;

    // Step 1: Check if companyId is provided
    if (!companyId) {
        return res.status(400).json({
            message: 'companyId is required in the request body',
        });
    }

    try {
        // Step 2: Fetch main categories where parentId is null and companyId matches
        const categories = await models.Categories.findAll({
            where: {
                parentId: null,
                companyId,
            },
        });

        if (!categories || categories.length === 0) {
            return res.status(404).json({
                message: 'No categories found for the provided companyId',
                data: [],
            });
        }

        // Step 3: Fetch subcategories and microcategories
        const categoriesWithChildren = await Promise.all(
            categories.map(async (category) => {
                const subcategories = await models.Categories.findAll({
                    where: {
                        parentId: category.id, // Fetch subcategories based on category id
                        companyId,
                    },
                });

                // Fetch microcategories for each subcategory
                const subcategoriesWithMicrocategories = await Promise.all(
                    subcategories.map(async (subcategory) => {
                        const microcategories = await models.Categories.findAll({
                            where: {
                                parentId: subcategory.id, // Fetch microcategories based on subcategory id
                                companyId,
                            },
                        });

                        return {
                            ...subcategory.toJSON(), // Convert to plain object
                            child: microcategories.map((microcategory) => microcategory.toJSON()),
                        };
                    })
                );

                return {
                    ...category.toJSON(), // Convert to plain object
                    child: subcategoriesWithMicrocategories,
                };
            })
        );

        // Step 4: Respond with the categories including subcategories and microcategories
        return res.status(200).json({
            message: 'Categories with subcategories and microcategories fetched successfully',
            data: categoriesWithChildren,
        });
    } catch (error) {
        // Log the error for debugging
        console.error('Error fetching categories:', error);

        // Step 5: Return error response
        return res.status(500).json({
            message: 'An error occurred while fetching categories',
            error: error.message,
        });
    }
}

async function addCategory(req, res) {
    const { categoryName, companyId, parentId, description, addedBy, ip_address } = req.body;

    // Step 1: Validate required fields
    if (!categoryName || !companyId) {
        return res.status(400).json({
            message: "categoryName and companyId are required fields.",
        });
    }

    try {
        // Step 2: Create the category
        const newCategory = await models.Categories.create({
            name: categoryName,        // Map categoryName to the 'name' field in the table
            companyId,
            description,
            addedBy,
            status: 1,
            ip_address,
            parentId: parentId || null // Allows nesting if parentId is provided
        });

        // Step 3: Return success response
        return res.status(201).json({
            message: "Category added successfully.",
            data: newCategory,
        });
    } catch (error) {
        // Step 4: Handle errors
        console.error("Error adding category:", error);
        return res.status(500).json({
            message: "An error occurred while adding the category.",
            error: error.message,
        });
    }
}

async function editCategory(req, res) {
    const { id, categoryName, description, addedBy, ip_address, companyId } = req.body;
    const updatedCategoryData = {
        companyId,
        name: categoryName,
        description: description,
        addedBy: addedBy,
        ip_address: ip_address,
    };

    // Check if the category name already exists for the given company but exclude the current category
    models.Categories.findOne({
        where: { name: categoryName, companyId, id: { [models.Sequelize.Op.ne]: id } }
    }).then(existingCategory => {
        if (existingCategory) {
            // If a category with the same name already exists for the company
            return res.status(409).json({
                message: "Category name already exists for this company!",
            });
        } else {
            // Proceed with the update
            models.Categories.update(updatedCategoryData, { where: { id: id } })
                .then(result => {
                    if (result[0] > 0) {
                        res.status(200).json({
                            message: "Category updated successfully",
                            post: updatedCategoryData
                        });
                    } else {
                        res.status(404).json({
                            message: "Category not found"
                        });
                    }
                })
                .catch(error => {
                    res.status(500).json({
                        message: "Something went wrong, please try again later!",
                        error: error.message || error
                    });
                });
        }
    }).catch(error => {
        res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error.message || error
        });
    });
}

async function deleteCategory(req, res) {
    const id = req.body.id;

    models.Categories.destroy({ where: { id: id } })
        .then(result => {
            if (result) {
                res.status(200).json({
                    message: "Category deleted successfully"
                });
            } else {
                res.status(200).json({
                    message: "Category not found"
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

module.exports = {
    getCategories: getCategories,
    addCategory: addCategory,
    editCategory: editCategory,
    deleteCategory: deleteCategory,
};
