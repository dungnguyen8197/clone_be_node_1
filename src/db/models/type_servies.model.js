const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('type_services', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(250),
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
    tableName: 'type_services',
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
};
