module.exports = function (sequelize, DataTypes) {
	const AdminCm = sequelize.define(
		'admin_cms',
		{
			id: {
				autoIncrement: true,
				type: DataTypes.INTEGER.UNSIGNED,
				allowNull: false,
				primaryKey: true,
			},
			user_name: {
				type: DataTypes.STRING(255),
				allowNull: true,
			},
			phone: {
				type: DataTypes.STRING(255),
				allowNull: false,
				unique: 'phone',
			},
			password: {
				type: DataTypes.STRING(255),
				allowNull: true,
			},
			is_active: {
				type: DataTypes.INTEGER,
				allowNull: true,
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
			tableName: 'admin_cms',
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
				{
					name: 'phone',
					unique: true,
					using: 'BTREE',
					fields: [{ name: 'phone' }],
				},
			],
		}
	);

	AdminCm.associate = (models) => {
		AdminCm.belongsToMany(models.Role, {
			as: 'roles',
			through: models.AdminHasRole,
			foreignKey: 'admin_id',
			otherKey: 'role_id',
		});
		AdminCm.belongsToMany(models.Permission, {
			as: 'permissions',
			through: models.AdminRolePermission,
			foreignKey: 'admin_id',
			otherKey: 'permission_id',
		});
		AdminCm.hasMany(models.AdminHasRole, {
			as: 'admin_has_role',
			foreignKey: 'admin_id',
		});
	};

	return AdminCm;
};
