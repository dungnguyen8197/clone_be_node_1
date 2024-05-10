const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
let config = require('../../config/setting');
let _ = require('lodash');

function extend(model) {
    //override belongsToMany
    model.deleteThoughs = [];

    model.old_belongsToMany = model.belongsToMany;
    model.belongsToMany = function (target, options) {
        if (!options || !options.constraints || !options.through) {
            return model.old_belongsToMany(target, options)
        }

        model.deleteThoughs.push({model: options.through, foreignKey: options.foreignKey});

        return model.old_belongsToMany(target, options);
    };


    model.old_hasMany = model.hasMany;
    model.hasMany = function (target, options) {
        if (!options || !options.constraints) {
            return model.old_hasMany(target, options)
        }

        model.deleteThoughs.push({model: target, foreignKey: options.foreignKey});

        return model.old_hasMany(target, options);
    };

    model.old_destroy = model.destroy;
    model.destroy = async function (options) {
        if (!model.deleteThoughs.length)
            return await model.old_destroy(options);

        let deletedItems = await model.findAll(options);
        let ids = deletedItems.map(item => item._id != undefined ? item._id : item.id);
        if (ids.length) {
            for (let though of model.deleteThoughs) {
                await though.model.destroy({where: {[though.foreignKey]: ids}});
            }
        }
        return await model.old_destroy(options);
    };

    model.prototype.old_destroy = model.prototype.destroy;
    model.prototype.destroy = async function () {
        for (let though of model.deleteThoughs) {
            await though.model.destroy({
                where: {
                    [though.foreignKey]: (this._id != undefined ? this._id : this.id)
                }
            });
        }
        await this.old_destroy();
    };

    model.upsertWhere = async function (attributes, where) {
        let fields = await model.findOne({where});
        if (fields)
            return await model.update(attributes, {where: where});
        else
            return await model.create(Object.assign(attributes, where));
    };

    // model.prototype.old_toJSON = model.prototype.toJSON;
    // model.prototype.toJSON = function (attributes = undefined) {
    //     if(!attributes)return this.old_toJSON();
    //     let obj = this.old_toJSON();
    //     let keys = Object.keys(obj);
    //     keys.forEach(key=>{
    //         if(attributes.indexOf(key) == -1)
    //             delete obj[key];
    //     });
    //     return obj;
    // }
}

/**
 * singleton class Database
 */
class Database {
    /**
     * init model
     *
     * @param  {[Object]} databaseConfig [config of mysql connection, format in `http://docs.sequelizejs.com/class/lib/sequelize.js~Sequelize.html#instance-constructor-constructor`]
     * @return {[undefine]}
     */
    static init(databaseConfig) {
        //defence create duplicate singleton
        if (this.sequelize) return;

        this.sequelize = new Sequelize(
            databaseConfig.database,
            databaseConfig.username,
            databaseConfig.password,
            _.merge(databaseConfig.options, {
                // logging: false,
                dialect: 'mysql',
                dialectOptions: {
                    decimalNumbers: true
                },
                operatorsAliases: false,
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                },
            })
        );

        this.loadModels();

        this.createModelsAssociations();
    }

    /**
     * load all models in folder `models`
     *
     * @return {[type]} [description]
     */
    static loadModels() {
        let modelsPath = path.join(__dirname, 'models');

        let modelFileNames = fs.readdirSync(modelsPath)
            .filter(name => name.toLowerCase().endsWith('.model.js'))
            .map(name => path.join(modelsPath, name));

        this.models = {};

        modelFileNames.forEach(fileName => {
            const model = require(path.join(fileName))(this.sequelize, Sequelize);

            extend(model);

            let modelName = model.name;

            if (model.modalNameAlias) {
                modelName = model.modalNameAlias;
            } else {
                modelName = modelName.startsWith('v2_') ? modelName.slice(3) : modelName;
                modelName = modelName.endsWith('ies') ? `${modelName.slice(0, -3)}y` : modelName;
                modelName = modelName.endsWith('s') ? modelName.slice(0, -1) : modelName;
                modelName = modelName.split('_')
                    .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
                    .join('');
            }

            this.models[modelName] = model;
        });

        console.log(this.models);
    }

    // /**
    //  * Create all associations of all models
    //  *
    //  * @return {[type]} [description]
    //  */
    static createModelsAssociations() {
        //
        Object
            .values(this.models)
            .filter(model => model.associate)
            .forEach(model => model.associate(this.models))
    }
}

Database.init(config.sequelize);

module.exports = Database;