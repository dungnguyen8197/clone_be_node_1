'use strict'
const admins = require('../../../constant/migrations/admins')
const roles = require("../../../constant/migrations/roles");
const permissions = require("../../../constant/migrations/permissions");
const type_services = require("../../../constant/migrations/type_services");

const router = require('../../../router/extensions').Router();
const models = router.models;

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("roles", roles);
    await queryInterface.bulkInsert("permissions", permissions);
    await queryInterface.bulkInsert("type_services", type_services);
    // await queryInterface.bulkInsert("admin_cms", admins)
    const admin_id = await Promise.all(
        admins.map((v) =>
            models.AdminCm.findOrCreate({
                where: { phone: v.phone },
                defaults: v,
            })
        )
    );
    const role = await models.Role.findOne({ where: {guard: "boss"} })
    await models.AdminHasRole.bulkCreate(
      JSON.parse(JSON.stringify(admin_id)).map((value) => ({
        admin_id: value[0].id,
        role_id: role.id,
        admin_type: "Boss",
        parent_id: 0,
        level_super_admin_id: 0,
        level_admin_id: 0,
        level_super_agent_id: 0,
        level_agent_id: 0,
        level: 1,
        type_services: 0,
        discount: 0,
        discount_by_id: 0,
        list_agent_id: 0,
        list_super_agent_id: 0,
      }))
    );
  },

  async down(queryInterface, Sequelize) {

  }
}