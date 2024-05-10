const router = require("./extensions").Router();
const models = router.models;
const { Op } = require("sequelize");
const { isEmpty } = require("../lib/validate");
const { ThrowReturn } = require("./extensions");

const all = async (req, res) => {
    const typeServices = await models.TypeService.findAll({});
    return res.sendData(typeServices);
};

const create = async (req, res) => {
    const { name } = req.body;
    const createdTypeService = await models.TypeService.findOrCreate({
        where: { name },
        defaults: { name },
    });
    if (!createdTypeService[1]) throw new ThrowReturn("Loại dịch vụ đã tồn tại");

    res.sendData(createdTypeService, "Thêm thành công");
};

const search = async (req, res) => {
    let limit = req.query?.limit || 10;
    let page = req.query?.page || 1;
    const { name, time_step_1, time_step_2 } = req.body;
    const condition = {};
    if (!isEmpty(name)) condition.name = { [Op.substring]: name };
    if (!isEmpty(time_step_1)) condition.created_at = { [Op.gte]: convertTimeStamp(time_step_1) };
    if (!isEmpty(time_step_2)) {
        condition.created_at = {
            ...condition.created_at,
            [Op.lte]: convertTimeStamp(time_step_2),
        };
    }
    const { rows, count } = await models.TypeService.findAndCountAll({
        where: condition,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [["updated_at", "DESC"]],
    });
    return res.sendData({ data: rows, total: count });
};

const update = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const conflictRole = await models.TypeService.findOne({ where: { name, id: { [Op.not]: id } } });
    if (conflictRole) throw new ThrowReturn("Tên đã được sử dụng");
    const updatedTypeService = await models.TypeService.update({ name }, { where: { id } });
    if (updatedTypeService[0] === 0) throw new ThrowReturn("Vai trò không tồn tại");

    res.sendData(null, "Sửa thành công");
};

const remove = async (req, res) => {
    const { id } = req.params;
    await models.TypeService.destroy({ where: { id } });
    return res.sendData(null, "Xóa thành công");
};

// require role
router.postS("/create", create, true, "", "boss");
router.postS("/search", search, true, "", "boss");
router.getS("/remove/:id", remove, true, "", "boss");
router.postS("/update/:id", update, true, "", "boss");
// require token
router.getS("/all", all, true);

module.exports = router;
