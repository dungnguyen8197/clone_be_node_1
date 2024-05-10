const router = require("../router/extensions").Router();
const models = router.models;
const admins = require("../constant/migrations/admins");

async function UpdateBoss() {
  const role = await models.Role.findOne({ where: { guard: "boss" } });
  const permissions = await models.Permission.findAll({});

  await Promise.all(
    admins.map((a) => {
      return new Promise(async (resolve) => {
        const admin = await models.AdminCm.findOrCreate({
          where: { phone: a.phone },
          defaults: a,
        });

        if (admin[1]) {
          await models.AdminHasRole.findOrCreate({
            where: { admin_id: admin[0].dataValues.id, role_id: role.id },
            defaults: {
              admin_id: admin[0].dataValues.id,
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
            },
          });

          await Promise.all(
            permissions.map((p) =>
              models.AdminRolePermission.findOrCreate({
                where: {
                  admin_id: admin[0].dataValues.id,
                  role_id: role.id,
                  permission_id: p.id,
                },
                defaults: {
                  admin_id: admin[0].dataValues.id,
                  role_id: role.id,
                  permission_id: p.id,
                },
              })
            )
          );
        }

        resolve();
      });
    })
  );
}

module.exports = UpdateBoss;
