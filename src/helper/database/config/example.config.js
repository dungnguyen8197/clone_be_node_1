require('dotenv').config({path: __dirname + '/./../../../../.env'});

console.log(process.env.mysql_user)
module.exports = {
    development: {
        username: process.env.mysql_user,
        password: process.env.mysql_password,
        database: process.env.mysql_database,
        host: process.env.mysql_host,
        dialect: "mysql",
        port: process.env.mysql_port || 3306,
    },
    test: {
        username: process.env.mysql_user,
        password: process.env.mysql_password,
        database: process.env.mysql_database,
        host: process.env.mysql_host,
        dialect: "mysql",
        port: process.env.mysql_port || 3306,
    },
    production: {
        username: process.env.mysql_user,
        password: process.env.mysql_password,
        database: process.env.mysql_database,
        host: process.env.mysql_host,
        dialect: "mysql",
        port: process.env.mysql_port || 3306,
    },
};
