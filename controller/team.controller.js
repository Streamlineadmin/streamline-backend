const models = require('../models');
const { Op } = require("sequelize");

// function addTeam(req, res) {
//     // Check if team name already exists for the given company
//     models.Teams.findOne({ where: { name: req.body.name, companyId: req.body.companyId } }).then(teamResult => {
//         if (teamResult) {
//             return res.status(409).json({
//                 message: "Team already exists!",
//             });
//         } else {
//             // Team does not exist, proceed to create
//             const team = {
//                 companyId: req.body.companyId,
//                 name: req.body.name,
//                 description: req.body.description,
//                 ip_address: req.body.ip_address,
//                 status: 1
//             };

//             models.Teams.create(team).then(result => {
//                 res.status(201).json({
//                     message: "Team added successfully",
//                     post: result
//                 });
//             }).catch(error => {
//                 res.status(500).json({
//                     message: "Something went wrong, please try again later!",
//                     error: error
//                 });
//             });
//         }
//     }).catch(error => {
//         res.status(500).json({
//             message: "Something went wrong, please try again later!",
//             error: error
//         });
//     });
// }

async function addTeam(req, res) {
    try {
        const { companyId, name, description, ip_address, rolePermissions } = req.body;

        // Check for duplicate team
        const existingTeam = await models.Teams.findOne({
            where: { name, companyId }
        });

        if (existingTeam) {
            return res.status(409).json({ message: "Team already exists!" });
        }

        // Create new team
        const newTeam = await models.Teams.create({
            companyId,
            name,
            description,
            ip_address,
            status: 1
        });

        const rolePermissionInserts = [];

        for (const perm of rolePermissions) {
            // Get feature ID
            const feature = await models.PermissionsFeatures.findOne({
                where: { feature: perm.feature }
            });

            if (!feature) continue; // Skip if feature not found

            for (const sub of perm.subFeature) {
                // Get subfeature ID
                const subFeature = await models.PermissionsSubFeatures.findOne({
                    where: { subfeature: sub.name, parent: feature.id }
                });

                if (!subFeature) continue; // Skip if subfeature not found

                // Push to array for bulk insert
                rolePermissionInserts.push({
                    role: newTeam.id, // newly created team ID
                    companyId,
                    permission: feature.id,
                    subpermission: subFeature.id,
                    create: sub.create || 0,
                    view: sub.view || 0,
                    edit: sub.edit || 0,
                    delete: sub.delete || 0,
                    ip_address,
                    status: 1
                });
            }
        }

        // Bulk insert RolePermissions
        await models.RolePermissions.bulkCreate(rolePermissionInserts);

        return res.status(201).json({
            message: "Team and permissions added successfully",
            team: newTeam,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error.message,
        });
    }
}


// function editTeam(req, res) {
//     const teamId = req.body.teamId;
//     const companyId = req.body.companyId;
//     const updatedTeamData = {
//         companyId,
//         name: req.body.name,
//         description: req.body.description,
//         ip_address: req.body.ip_address,
//         status: req.body.status || 1  // Defaults to 1 if not provided
//     };

//     // Check if the team name already exists for the given company but exclude the current team
//     models.Teams.findOne({
//         where: { name: req.body.name, companyId, id: { [models.Sequelize.Op.ne]: teamId } }
//     }).then(existingTeam => {
//         if (existingTeam) {
//             // If a team with the same name already exists for the company
//             return res.status(409).json({
//                 message: "Team name already exists for this company!",
//             });
//         } else {
//             // Proceed with the update
//             models.Teams.update(updatedTeamData, { where: { id: teamId } })
//                 .then(result => {
//                     if (result[0] > 0) {
//                         res.status(200).json({
//                             message: "Team updated successfully",
//                             post: updatedTeamData
//                         });
//                     } else {
//                         res.status(404).json({
//                             message: "Team not found"
//                         });
//                     }
//                 })
//                 .catch(error => {
//                     res.status(500).json({
//                         message: "Something went wrong, please try again later!",
//                         error: error.message || error
//                     });
//                 });
//         }
//     }).catch(error => {
//         res.status(500).json({
//             message: "Something went wrong, please try again later!",
//             error: error.message || error
//         });
//     });
// }

async function editTeam(req, res) {
    const teamId = req.body.teamId;
    const companyId = req.body.companyId;
    const ip_address = req.body.ip_address;
    const updatedTeamData = {
      companyId,
      name: req.body.name,
      description: req.body.description,
      ip_address,
      status: req.body.status || 1
    };
    const rolePermissions = req.body.rolePermissions || [];
  
    try {
      // Check if a different team with the same name already exists
      const existingTeam = await models.Teams.findOne({
        where: {
          name: req.body.name,
          companyId,
          id: { [models.Sequelize.Op.ne]: teamId }
        }
      });
  
      if (existingTeam) {
        return res.status(409).json({
          message: "Team name already exists for this company!",
        });
      }
  
      // Update the team
      const result = await models.Teams.update(updatedTeamData, { where: { id: teamId } });
  
      if (result[0] === 0) {
        return res.status(404).json({ message: "Team not found" });
      }
  
      // Delete existing RolePermissions
      await models.RolePermissions.destroy({ where: { role: teamId } });
  
      const rolePermissionInserts = []; // ✅ Declare this array
  
      for (const perm of rolePermissions) {
        const feature = await models.PermissionsFeatures.findOne({
          where: { feature: perm.feature }
        });
  
        if (!feature) continue;
  
        for (const sub of perm.subFeature) {
          const subFeature = await models.PermissionsSubFeatures.findOne({
            where: { subfeature: sub.name, parent: feature.id }
          });
  
          if (!subFeature) continue;
  
          rolePermissionInserts.push({
            role: teamId,
            companyId,
            permission: feature.id,
            subpermission: subFeature.id,
            create: sub.create || 0,
            view: sub.view || 0,
            edit: sub.edit || 0,
            delete: sub.delete || 0,
            ip_address,
            status: 1
          });
        }
      }
  
      // Bulk insert
      if (rolePermissionInserts.length > 0) {
        await models.RolePermissions.bulkCreate(rolePermissionInserts);
      }
  
      return res.status(200).json({
        message: "Team and permissions updated successfully",
        team: updatedTeamData,
      });
  
    } catch (error) {
      return res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error.message || error
      });
    }
  }
  



function deleteTeam(req, res) {
    const teamId = req.body.teamId;  // Assuming the team ID is passed as a URL parameter

    models.Teams.destroy({ where: { id: teamId } })
        .then(result => {
            if (result) {
                res.status(200).json({
                    message: "Team deleted successfully"
                });
            } else {
                res.status(200).json({
                    message: "Team not found"
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



function getTeamsById(req, res) {
    const id = req.params.id;

    models.Teams.findByPk(id).then(result => {
        res.status(200).json(result);
    }).catch(error => {
        res.status(500).json({
            message: "something went wrong, please try again later!"
        });
    });
}

// function getTeams(req, res) {
//     models.Teams.findAll({
//         where: {
//             companyId: req.body.companyId
//         }
//     }).then(async result => {
//         if (!result || result.length === 0) {
//             let teams = res.status(200).json([]);
//             teams.map(async (team, index) => {
//                 const rolePermissionsData = await models.RolePermissions.findAll({
//                     where: {
//                         companyId: req.body.companyId,
//                         role: {
//                             [Op.in]: teamIds
//                         }
//                     }
//                 });

//                 let rolesAccess = [];

//                 for (const rolePermission of rolePermissionsData) {
//                     let feature = await models.PermissionsFeatures.findAll({
//                         where: { id: rolePermission.permission }
//                     });
//                     let subfeature = await models.PermissionsSubFeatures.findAll({
//                         where: { id: rolePermission.subpermission }
//                     });
//                     // rolePermission.dataValues.feature = feature[0] ? feature[0].feature : null;
//                     // rolePermission.dataValues.subfeature = subfeature[0] ? subfeature[0].subfeature : null;
//                     rolesAccess.push({
//                         feature: feature[0] ? feature[0].feature : null,
//                         subfeature: subfeature[0] ? subfeature[0].subfeature : null,
//                         create: rolePermission.create,
//                         edit: rolePermission.edit,
//                         view: Number(rolePermission.view),
//                         delete: rolePermission.delete
//                     });
//                     teams[index].dataValues.permissions = teams[index].dataValues.rolesAccess || [];
//                 }
//             });
//             return teams;
//         }
//         res.status(200).json(result);
//     })
//         .catch(error => {
//             console.error("Error fetching blogs:", error);
//             res.status(500).json({
//                 message: "Something went wrong, please try again later!"
//             });
//         });
// }

async function getTeams(req, res) {
    try {
        const teams = await models.Teams.findAll({
            where: {
                companyId: req.body.companyId
            }
        });

        if (!teams || teams.length === 0) {
            return res.status(200).json([]);
        }

        const teamIds = teams.map(team => team.id);

        const rolePermissionsData = await models.RolePermissions.findAll({
            where: {
                companyId: req.body.companyId,
                role: {
                    [Op.in]: teamIds
                }
            }
        });

        // Build permission map per team (role)
        const permissionMap = {};

        for (const rolePermission of rolePermissionsData) {
            const [feature] = await models.PermissionsFeatures.findAll({
                where: { id: rolePermission.permission }
            });

            const [subfeature] = await models.PermissionsSubFeatures.findAll({
                where: { id: rolePermission.subpermission }
            });

            const permissionEntry = {
                feature: feature ? feature.feature : null,
                subfeature: subfeature ? subfeature.subfeature : null,
                create: rolePermission.create,
                edit: rolePermission.edit,
                view: Number(rolePermission.view),
                delete: rolePermission.delete
            };

            if (!permissionMap[rolePermission.role]) {
                permissionMap[rolePermission.role] = [];
            }

            permissionMap[rolePermission.role].push(permissionEntry);
        }

        // Append permissions to each team
        const enrichedTeams = teams.map(team => ({
            ...team.dataValues,
            permissions: permissionMap[team.id] || []
        }));

        return res.status(200).json(enrichedTeams);
    } catch (error) {
        console.error("Error fetching teams:", error);
        return res.status(500).json({
            message: "Something went wrong, please try again later!"
        });
    }
}



module.exports = {
    addTeam: addTeam,
    getTeamsById: getTeamsById,
    getTeams: getTeams,
    editTeam: editTeam,
    deleteTeam: deleteTeam
}