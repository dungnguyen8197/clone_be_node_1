const router = require('./extensions').Router();
const models = router.models;

// remove after dev
const sync = async (req, res) => {
	// await models.AdminCm.sync({ force: true });

	// await models.AdminHasRole.sync({ force: true });

	// await models.AdminRolePermission.sync({ force: true });

	// await models.PermissionHasMenu.sync({ force: true });

	// await models.Permission.sync({ force: true });

	// await models.RoleHasPermission.sync({ force: true });

	// await models.Role.sync({ force: true });

	// await models.AttachmentDeviceBatch.sync({ force: true });

    // await models.AttachmentDevice.sync({ force: true });

    // await models.DeviceCategory.sync({ force: true });

	// await models.UseProces.sync({ force: true });

	// await models.Device.sync({ force: true });
	
    // await models.DeviceBatche.sync({ force: true });

	// await models.Employee.sync({ force: true });

    // await models.Department.sync({ force: true });

    // await models.Company.sync({ force: true });

    // await models.DeviceImage.sync({ force: true });

	res.json('sync');
};

router.getS('/sync', sync, false);
module.exports = router;
