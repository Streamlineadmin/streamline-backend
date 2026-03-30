const models = require("../models");
const { Op } = require('sequelize');

async function getCategories(req, res) {
    const { companyId } = req.body;

    // Step 1: Check if companyId is provided
    if (!companyId) {
        return res.status(400).json({
            message: 'companyId is required in the request body',
        });
    }

    try {
        // Fetch all categories for the company in a single optimized query
        // Using raw: true avoids expensive Sequelize model instantiation
        const allCategories = await models.Categories.findAll({
            where: { companyId },
            raw: true
        });

        if (!allCategories || allCategories.length === 0) {
            return res.status(200).json({
                message: 'No categories found for the provided companyId',
                data: [],
            });
        }

        // Build the parent-child tree structure in memory using O(N) approach
        const categoryMap = {};
        const rootCategories = [];

        // First pass: initialize child arrays and populate the lookup map
        for (const category of allCategories) {
            category.child = [];
            categoryMap[category.id] = category;
        }

        // Second pass: organize categories into a hierarchical tree
        for (const category of allCategories) {
            if (category.parentId) {
                if (categoryMap[category.parentId]) {
                    categoryMap[category.parentId].child.push(category);
                }
            } else {
                rootCategories.push(category);
            }
        }

        return res.status(200).json({
            message: 'Categories with subcategories and microcategories fetched successfully',
            data: rootCategories,
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
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

async function addMultipleCategory(req, res) {
  try {
    const { category, companyId, addedBy } = req.body;

    const newCategory = await models.Categories.create({
      name: category.name,
      companyId,
      addedBy,
      status: 1,
      parentId: null
    });

    const bulkSubcategory = [];

    if (Array.isArray(category.subcategory)) {
      for (const element of category.subcategory) {
        bulkSubcategory.push({
          name: element.name,
          companyId,
          addedBy,
          status: 1,
          parentId: newCategory.id
        });
      }

      if (bulkSubcategory.length) {
        const subCategories = await models.Categories.bulkCreate(bulkSubcategory);
        const bulkMicrocategory = [];
        let j = 0;

        for (const element of category.subcategory) {
          if (Array.isArray(element.microcategory)) {
            for (let i = 0; i < element.microcategory.length; ++i) {
              bulkMicrocategory.push({
                name: element.microcategory[i].name,
                companyId,
                addedBy,
                status: 1,
                parentId: subCategories[j].id
              });
            }
          }
          j++;
        }

        if (bulkMicrocategory.length) {
          await models.Categories.bulkCreate(bulkMicrocategory);
        }
      }
    }

    res.status(201).json({ message: "Category Created Successfully." });

  } catch (error) {
    res.status(500).json({
      message: "An error occurred while adding the category.",
      error: error.message
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

    if (!id) {
        return res.status(400).json({ message: 'Category ID is required' });
    }

    try {
        // Step 1: Get the main category
        const category = await models.Categories.findOne({ where: { id } });
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Step 2: Get all direct children
        const subCategories = await models.Categories.findAll({ where: { parentId: id } });
        const subCategoryIds = subCategories.map(cat => cat.id);

        // Step 3: Get all grandchildren (microcategories)
        let microCategoryIds = [];
        if (subCategoryIds.length > 0) {
            const microCategories = await models.Categories.findAll({
                where: { parentId: { [Op.in]: subCategoryIds } }
            });
            microCategoryIds = microCategories.map(cat => cat.id);
        }

        // Step 4: Combine all IDs to delete
        const allCategoryIds = [id, ...subCategoryIds, ...microCategoryIds];

        // Step 5: Nullify category fields in Items
        await models.Items.update(
            {
                category: models.sequelize.literal(`CASE WHEN category IN (${allCategoryIds.join(',')}) THEN NULL ELSE category END`),
                subCategory: models.sequelize.literal(`CASE WHEN subCategory IN (${allCategoryIds.join(',')}) THEN NULL ELSE subCategory END`),
                microCategory: models.sequelize.literal(`CASE WHEN microCategory IN (${allCategoryIds.join(',')}) THEN NULL ELSE microCategory END`),
            },
            {
                where: {
                    [Op.or]: [
                        { category: { [Op.in]: allCategoryIds } },
                        { subCategory: { [Op.in]: allCategoryIds } },
                        { microCategory: { [Op.in]: allCategoryIds } },
                    ]
                }
            }
        );

        // Step 6: Delete all categories at once
        await models.Categories.destroy({ where: { id: { [Op.in]: allCategoryIds } } });

        return res.status(200).json({ message: 'Category and all linked subcategories/microcategories deleted successfully.' });

    } catch (error) {
        console.error('Error deleting category:', error);
        return res.status(500).json({
            message: 'Something went wrong while deleting category',
            error
        });
    }
}


module.exports = {
    getCategories: getCategories,
    addCategory: addCategory,
    editCategory: editCategory,
    deleteCategory: deleteCategory,
    addMultipleCategory: addMultipleCategory,
};
