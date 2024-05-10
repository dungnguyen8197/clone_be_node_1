module.exports = function (sequelize, DataTypes) {
	const AdminHasRole = sequelize.define(
		'admin_has_roles',
		{
			id: {
				autoIncrement: true,
				type: DataTypes.INTEGER.UNSIGNED,
				allowNull: false,
				primaryKey: true,
			},
			role_id: {
				type: DataTypes.INTEGER.UNSIGNED,
				allowNull: false,
			},
			admin_id: {
				type: DataTypes.INTEGER.UNSIGNED,
				allowNull: false,
			},
			admin_type: {
				type: DataTypes.STRING(191),
				allowNull: true,
				defaultValue: '',
			},
			parent_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			level_super_admin_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			level_admin_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			level_super_agent_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			level_agent_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			level: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			type_services: {
				type: DataTypes.INTEGER.UNSIGNED,
				allowNull: false,
			},
			discount: {
				type: DataTypes.INTEGER,
				allowNull: true,
				defaultValue: 0,
			},
			discount_by_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			list_agent_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				defaultValue: 0,
			},
			list_super_agent_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				defaultValue: 0,
			},
		},
		{
			sequelize,
			tableName: 'admin_has_roles',
			timestamps: false,
			indexes: [
				{
					name: 'PRIMARY',
					unique: true,
					using: 'BTREE',
					fields: [{ name: 'id' }],
				},
			],
		}
	);
	// AdminHasRole.removeAttribute('id');

	AdminHasRole.associate = (models) => {
		AdminHasRole.belongsTo(models.AdminCm, {
			as: 'parent',
			foreignKey: 'admin_id',
		});
		AdminHasRole.belongsTo(models.AdminCm, {
			as: 'super_agent',
			foreignKey: 'level_super_agent_id',
		});
		AdminHasRole.belongsTo(models.AdminCm, {
			as: 'agent',
			foreignKey: 'level_agent_id',
		});
		AdminHasRole.belongsTo(models.Role, {
			as: 'admin_has_role_role',
			foreignKey: 'role_id',
		});
		AdminHasRole.belongsTo(models.TypeService, {
			as: 'type_service',
			foreignKey: 'type_services',
		});
	
	};

	return AdminHasRole;
};
