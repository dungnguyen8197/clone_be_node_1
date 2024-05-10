const router = require("./extensions").Router();
const { Op } = require("sequelize");
const { convertTimeStamp } = require("../lib/formatData");
const { isEmpty } = require("../lib/validate");
const { models } = require("./../db");
const { ThrowReturn } = require("./extensions");

const all = async (req, res) => {
    const { currentAdmin } = req;
    const currentAdminRole = await models.AdminCm.findAll({
        where: { id: currentAdmin.id },
        attributes: ["roles.level", "roles.type_services"],
        include: { model: models.Role, as: "roles" },
        raw: true,
    });
    let permissions = [];
    if (currentAdminRole.map((r) => r.level).includes(1))
        permissions = await models.Permission.findAll({
            order: [["created_at", "ASC"]],
        });
    else
        permissions = await models.Permission.findAll({
            include: {
                model: models.AdminRolePermission,
                as: "admin_role_permission",
                attributes: [],
                where: { admin_id: currentAdmin.id },
                required: true,
            },
            order: [["updated_at", "DESC"]],
        });
    return res.sendData(permissions);
};

const search = async (req, res) => {
    let limit = req.query?.limit || 10;
    let page = req.query?.page || 1;
    const { descriptions, permission_name, time_step_1, time_step_2 } =
        req.body;
    const condition = {};
    if (!isEmpty(descriptions)) condition.descriptions = { [Op.substring]: descriptions };
    if (!isEmpty(permission_name)) condition.permission_name = { [Op.substring]: permission_name };
    if (!isEmpty(time_step_1)) condition.created_at = { [Op.gte]: convertTimeStamp(time_step_1) };
    if (!isEmpty(time_step_2)) {
        condition.created_at = {
            ...condition.created_at,
            [Op.lte]: convertTimeStamp(time_step_2),
        };
    }
    const { rows, count } = await models.Permission.findAndCountAll({
        where: condition,
        limit: parseInt(limit),
        include: { model: models.Role, as: "roles" },
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [["created_at", "ASC"]],
        group: ['id']
    });
    return res.sendData({ data: rows, total: count.length });
};

const create = async (req, res) => {
    const { permission_name, descriptions } = req.body;
    const createdPermission = await models.Permission.findOrCreate({
        where: { permission_name },
        defaults: { permission_name, descriptions },
    });
    if (!createdPermission[1]) throw new ThrowReturn("Quyền đã tồn tại");
    return res.sendData(null, "Thêm thành công");
};

const remove = async (req, res) => {
    const { id } = req.params;
    const roleHasPermission = await models.RoleHasPermission.findAll({ where: { permission_id: id } });
    if (!isEmpty(roleHasPermission)) throw new ThrowReturn("Vui lòng xóa hết liên kết đến vai trò liên quan");
    await models.Permission.destroy({ where: { id } });
    return res.sendData(null, "Xóa thành công");
};

const update = async (req, res) => {
    const { id } = req.params;
    const { permission_name, descriptions } = req.body;
    const conflictPermission = await models.Permission.findOne({ where: { permission_name, id: { [Op.not]: id } } });
    if (conflictPermission) throw new ThrowReturn("Slug đã được sử dụng")
    const updatedPermission = await models.Permission.update(
        { permission_name, descriptions },
        { where: { id } }
    );
    if (updatedPermission[0] === 0) throw new ThrowReturn("Quyền không tồn tại");
    return res.sendData(null, "Sửa thành công");
};

// require role
router.getS("/all", all, true, '', 'boss');
router.postS("/search", search, true, '', 'boss');
router.postS("/create", create, true, '', 'boss');
router.getS("/remove/:id", remove, true, '', 'boss');
router.postS("/update/:id", update, true, '', 'boss');

module.exports = router;

