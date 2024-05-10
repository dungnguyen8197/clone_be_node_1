module.exports = function (sequelize, DataTypes) {
	const AdminRolePermission = sequelize.define(
		'admin_role_permission',
		{
			admin_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			permission_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			role_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
		},
		{
			sequelize,
			tableName: 'admin_role_permission',
			timestamps: true,
			createdAt: 'created_at',
			updatedAt: 'updated_at',
		}
	);
	AdminRolePermission.removeAttribute('id');

	AdminRolePermission.associate = (models) => {
		AdminRolePermission.belongsTo(models.Permission, {
			as: 'admin_role_permission_permission',
			foreignKey: 'permission_id',
		});
		AdminRolePermission.belongsTo(models.Role, {
			as: 'admin_role_permission_role',
			foreignKey: 'role_id',
		});
		AdminRolePermission.belongsTo(models.AdminCm, {
			as: 'admin_has_roles_admin',
			foreignKey: 'admin_id',
		});
	};

	return AdminRolePermission;
};
