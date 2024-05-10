module.exports = function (sequelize, DataTypes) {
	const Role = sequelize.define(
		'roles',
		{
			id: {
				autoIncrement: true,
				type: DataTypes.INTEGER.UNSIGNED,
				allowNull: false,
				primaryKey: true,
			},
			name: {
				type: DataTypes.STRING(255),
				allowNull: true,
			},
			guard: {
				type: DataTypes.STRING(50),
				allowNull: true,
			},
			level: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			is_viewer: {
				type: DataTypes.TINYINT,
				allowNull: false,
				defaultValue: 0,
			},
			type_services: {
				type: DataTypes.INTEGER.UNSIGNED,
				allowNull: false,
				defaultValue: 0,
			},
			created_at: {
				type: DataTypes.DATE,
				defaultValue: sequelize.literal('current_timestamp()')
			},
			updated_at: {
				type: DataTypes.DATE,
				defaultValue: sequelize.literal('current_timestamp()'),
				onUpdate: sequelize.literal('current_timestamp()')
			}
		},
		{
			sequelize,
			tableName: 'roles',
			timestamps: true,
			createdAt: 'created_at',
			updatedAt: 'updated_at',
			underscored: true,
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

	Role.associate = (models) => {
		Role.belongsToMany(models.AdminCm, {
			as: 'role_admin_cms',
			through: models.AdminHasRole,
			foreignKey: 'role_id',
			otherKey: 'admin_id',
		});
		Role.belongsTo(models.TypeService, {
			as: 'type_service',
			foreignKey: 'type_services',
		});
		Role.hasMany(models.AdminRolePermission, {
			as: 'role_admin_role_permissions',
			foreignKey: 'role_id',
		});
		Role.hasMany(models.AdminHasRole, {
			as: 'role_admin_has_roles',
			foreignKey: 'role_id',
		});
		Role.hasMany(models.RoleHasPermission, {
			as: 'role_role_has_permissions',
			foreignKey: 'role_id',
		});
	};

	return Role;
};
