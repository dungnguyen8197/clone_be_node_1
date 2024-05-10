module.exports = function(sequelize, DataTypes) {
  const Permission = sequelize.define('permissions', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    permission_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    descriptions: {
      type: DataTypes.STRING(255),
      allowNull: true
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
  }, {
    sequelize,
    tableName: 'permissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
    ]
  });

  Permission.associate = (models) => {
    Permission.hasMany(models.RoleHasPermission, { as: "role_has_permissions", foreignKey: "permission_id"});
    // Permission.hasMany(models.AdminRolePermission, { as: "permission_admin_role_permissions", foreignKey: "permission_id"});
    Permission.hasMany(models.AdminRolePermission, {as: 'admin_role_permissions', foreignKey: 'permission_id'});

    Permission.belongsToMany(models.Role, {
        as: "roles",
        through: models.RoleHasPermission,
        foreignKey: 'permission_id',
			  otherKey: 'role_id',
    });

  }

  return Permission;
};

