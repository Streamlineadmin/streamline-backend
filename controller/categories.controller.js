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


module.exports = {
    getCategories: getCategories
};
