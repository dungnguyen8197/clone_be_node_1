let config = require("../../config/setting");
let log4js = require('log4js');
log4js.configure(config.logger4js);
let logger = log4js.getLogger('golf');

module.exports = {
    log: logger,
    logger: logger,
};