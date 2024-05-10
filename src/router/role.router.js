const router = require('./extensions').Router();
const models = router.models;
const {Op} = require('sequelize');
const {isEmpty} = require('../lib/validate');
const {ThrowReturn} = require('./extensions');

const all = async (req, res) => {
    const roles = await models.Role.findAll({order: [['type_services','ASC'], ["level", "ASC"], ["is_viewer", "ASC"]]})
    return res.sendData(roles);
};

const search = async (req, res) => {
    let limit = req.query?.limit || 10;
    let page = req.query?.page || 1;
    const { name, guard, type_services, level, time_step_1, time_step_2 } = req.body;
    const condition = {};
    if (!isEmpty(name)) condition.name = { [Op.substring]: name };
    if (!isEmpty(guard)) condition.guard = { [Op.substring]: guard };
    if (!isEmpty(type_services)) condition.type_services = type_services;
    if (!isEmpty(level)) condition.level = level;
    if (!isEmpty(time_step_1)) condition.created_at = { [Op.gte]: convertTimeStamp(time_step_1) };
    if (!isEmpty(time_step_2)) {
        condition.created_at = {
            ...condition.created_at,
            [Op.lte]: convertTimeStamp(time_step_2),
        };
    }
    const { rows, count } = await models.Role.findAndCountAll({
        where: condition,
        include: {
            model: models.TypeService,
            as: "type_service",
        },
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [["type_services", "ASC"], ["level", "ASC"], ["is_viewer", "ASC"]],
    });
    return res.sendData({ data: rows, total: count });
};

const changePermissionByRole = async (req, res) => {
    const {role_id} = req.params;
    const {permission_id} = req.body;

    const roleHasPermissions = await models.RoleHasPermission.findAll({where: {role_id}, raw: true});
    const roleHasPermissionId = roleHasPermissions.map((c) => c.permission_id);
    const removePermission = roleHasPermissionId.filter((c) => {
        if (!permission_id.includes(c)) return c;
    });
    for (const p of permission_id) {
        if (!roleHasPermissionId.includes(p)) {
            await models.RoleHasPermission.findOrCreate({
                where: {role_id, permission_id: p},
                defaults: {role_id, permission_id: p},
            });
            const admins = await models.AdminCm.findAll({
                include: {model: models.AdminHasRole, as: 'admin_has_role', where: {role_id}},
            })
            if (!isEmpty(admins)) {
                for (const a of admins) {
                    await models.AdminRolePermission.findOrCreate({
                        where: {role_id, permission_id: p, admin_id: a.id},
                        defaults: {role_id, permission_id: p, admin_id: a.id},
                    })
                }
            }
        }
    }
    if (!removePermission.includes(undefined) && !isEmpty(removePermission)) {
        await models.RoleHasPermission.destroy({where: {role_id, permission_id: {[Op.or]: removePermission}}})
        await models.AdminRolePermission.destroy({where: {role_id, permission_id: {[Op.or]: removePermission}}})
    }

    return res.sendData(null, 'Change role success!')
}

const getPermissionByRole = async (req, res) => {
    const {role_id} = req.body
    const permission = await models.Permission.findAll({
        include: {
            model: models.RoleHasPermission,
            as: "role_has_permissions",
            where: { role_id },
            require: true
        },
    });

    return res.sendData(permission)
}


const getRoleUnder = async (req, res) => {
    const {currentAdmin} = req
    const currentAdminRole = await models.AdminCm.findAll({
        where: {id: currentAdmin.id},
        attributes: ['roles.level', 'roles.type_services'],
        include: {model: models.Role, attributes: [], as: 'roles', through: {attributes: []}},
        raw: true,
    })
    const roleLevel = currentAdminRole.map((r) => r.level)
    let listRole = []
    if (roleLevel.includes(1)) {
        listRole = await models.Role.findAll({where: {level: {[Op.gt]: 1}}})
    } else {
        for (const r of currentAdminRole) {
            const list = await models.Role.findAll({where: {[Op.and]: [{level: {[Op.gt]: r.level}}, {type_services: r.type_services}]}})
            listRole = [...listRole, ...list]
        }
    }

    res.sendData(listRole)
}

const create = async (req, res) => {
    const { name, guard, level, is_viewer, type_services } = req.body;
    const createdRole = await models.Role.findOrCreate({
      where: { guard },
      defaults: { name, guard, level, is_viewer, type_services },
    });
    if (!createdRole[1]) throw new ThrowReturn('Vai trò đã tồn tại');

    res.sendData(null, "Thêm thành công")
}


const update = async (req, res) => {
    const { id } = req.params;
    const { name, guard, level, is_viewer, type_services } = req.body;
    const conflictRole = await models.Role.findOne({ where: { guard, id: { [Op.not]: id } } });
    if (conflictRole) throw new ThrowReturn("Slug đã được sử dụng")
    const updatedRole = await models.Role.update({ name, guard, level, is_viewer, type_services }, { where: { id } });
    if (updatedRole[0] === 0) throw new ThrowReturn('Vai trò không tồn tại');

    res.sendData(null, "Sửa thành công")
}

const remove = async (req, res) => {
    const { id } = req.params;
    await models.Role.destroy({ where: { id } });
    await models.AdminHasRole.destroy({ where: { role_id: id } });
    await models.RoleHasPermission.destroy({ where: { role_id: id } });
    await models.AdminRolePermission.destroy({ where: { role_id: id } });
    
    return res.sendData(null, "Xóa thành công");
};

// require role
router.getS('/all', all, true, '', 'boss')
router.postS('/create', create, true, '', 'boss')
router.postS('/search', search, true, '', 'boss')
router.getS('/remove/:id', remove, true, '', 'boss')
router.postS('/update/:id', update, true, '', 'boss')
router.postS('/permission-by-role', getPermissionByRole, true, '', 'boss')
router.postS('/change-permission-by-role/:role_id', changePermissionByRole, true, '', 'boss')
// require token
router.postS('/get-under', getRoleUnder, true)

module.exports = router

