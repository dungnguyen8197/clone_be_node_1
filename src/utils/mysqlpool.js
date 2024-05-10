/**
 *
 */
 let mysql = require('mysql2/promise');
 let config = require('../../config/setting');
 
 let pool = mysql.createPool(config.mysql);
 module.exports = pool;
 