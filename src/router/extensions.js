let express = require('express');
let translate = require('../utils/translation');
let logger = require('../utils/logger').log;
let db = require('./../db/index');
let redispool = require('../utils/redispool');
let ThrowReturn = require('../lib/ThrowReturn');
const { isEmpty } = require('../lib/validate');
const { decodeToken, extendSession } = require('../lib/token');
const { models } = require('./../db/index');
const { Op } = require('sequelize');

function process_exception(req, res, error) {
	let msg = error.message;
	let language = error.lang || req.query.lang || req.body.lang || 'vi';

	if (typeof error === 'ThrowReturn' || error instanceof ThrowReturn) {
		res.json({
			error_code: error.code,
			error_msg: translate.T(error.message, language, ...error.args),
			data: null,
		});
		return;
	}

	if (msg && msg.startsWith('Validation error:'))
		msg = msg.replace('Validation error:', '').trim();

	res.json({
		error_code: 1,
		error_msg: translate.T(`Có lỗi xảy ra, vui lòng thử lại sau.`, language),
		error_msg_debug: msg,
	});
}

/**
 * Common & custom reponse
 */
function sendData(data = null, message = null) {
	let response = {
		error_code: 0,
		data: data,
		error_msg: message,
	};

	this.json(response);
}

/**
 * safety call router.get function
 * eg: router.get('abc', safety(callback))
 *
 * @param  {Function} callback    [description]
 * @param validateToken
 * @param  {Function} exception [description]
 * @return {[type]}            [description]
 */
function safety(
	callback,
	validateToken,
	exception = process_exception,
	permissions,
	roles
) {
	if (callback.constructor.name === 'AsyncFunction') {
		return async function (req, res, ...args) {
			// Custom function
			res.sendData = sendData;

			try {
				if (req.headers['x-token']) extendSession(req.headers['x-token']);
				if (!validateToken && isEmpty(roles) && isEmpty(permissions)) return await callback(req, res, ...args);
				// 1 decode token
				if (!req.headers.authorization || req.headers.authorization.split(' ')[0] !== 'Bearer') 
					throw new ThrowReturn('No access token').error_code(498);
				const decode = decodeToken(req.headers.authorization);
				if (isEmpty(decode)) throw new ThrowReturn('Token invalid').error_code(498);
				// 2 check admin exist or not
				const currentAdmin = await models.AdminCm.findByPk(decode.id, {raw: true});
				if (isEmpty(currentAdmin)) throw new ThrowReturn('Admin not existed');
				// 3 check role
				if (!isEmpty(roles)) {
                    const validateRole = await models.AdminCm.findOne({
                        where: { id: decode.id },
                        include: { model: models.Role, as: "roles", where: { guard: roles }, required: true },
                    });
                    if (isEmpty(validateRole)) throw new ThrowReturn("Bạn đang không đủ vai trò truy cập, vui lòng liên hệ Admin để nâng cấp tài khoản").error_code(403);
                }
				// 4 check permission
				if (!isEmpty(permissions)) {
					const validateRole = await models.AdminCm.findOne({
                        where: { id: decode.id },
                        include: { model: models.Role, as: "roles", where: { guard: 'boss' }, required: true },
                    });
					// if is boss permission is not require 
					if (isEmpty(validateRole)) { 
						const validatePermission = await models.AdminCm.findOne({
							where: { id: decode.id },
							include: {
								model: models.Permission,
								as: "permissions",
								where: { permission_name: permissions },
								required: true,
							},
						});
						if (isEmpty(validatePermission)) throw new ThrowReturn("Bạn đang không đủ quyền truy cập, vui lòng liên hệ Admin để nâng cấp tài khoản").error_code(403);
					}
                }
				// Add current admin id to request
				req.currentAdminId = decode.id;
				req.currentAdmin = currentAdmin;
				return await callback(req, res, ...args);
			} catch (error) {
				if (exception) exception(req, res, error);
			}
		};
	} else {
		return function (req, res, ...args) {
			try {
				return callback(req, res, ...args);
			} catch (error) {
				if (exception) exception(req, res, error);
			}
		};
	}
}

/**
 * override `express.Router()` function
 */
function Router(...args) {
	let router = express.Router(...args);

	//add function `getS` to call get safety
	router.getS = function (path, callback, validateToken = true, permissions, roles, exception = process_exception) {
        this.get(path, safety(callback, validateToken, exception, permissions, roles));
    };
	router.postS = function (path, callback, validateToken = true, permissions, roles, exception = process_exception) {
        this.post(path, safety(callback, validateToken, exception, permissions, roles));
    };
	router.deleteS = function (path, callback, validateToken = true, permissions, roles, exception = process_exception) {
        this.delete(path, safety(callback, validateToken, exception, permissions, roles));
    };

	//add db to router
	router.db = db;

	router.sequelize = db.sequelize;

	//add models
	router.models = db.models;

	//add redis pool to router
	router.redispool = redispool;

	//add logger to router
	router.logger = logger;
	router.ThrowReturn = ThrowReturn;

	return router;
}

module.exports = {
	safety,
	Router,
	ThrowReturn,
};
