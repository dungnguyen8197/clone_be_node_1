module.exports = function(sequelize, DataTypes) {
  const RoleHasPermission =  sequelize.define('role_has_permission', {
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'role_has_permission',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
  });
  RoleHasPermission.removeAttribute('id');

  RoleHasPermission.associate = (models) => {
    RoleHasPermission.belongsTo(models.Role, { as: "role_has_permission_role", foreignKey: "role_id"});
    RoleHasPermission.belongsTo(models.Permission, { as: "role_has_permission_permission", foreignKey: "permission_id"});
  }

  return RoleHasPermission;
};
