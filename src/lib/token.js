const jwt = require('jsonwebtoken');
const randToken = require('rand-token');
const { privateKey } = require('../../config/setting');
const redisPool = require('../utils/redispool');
const ThrowReturn = require('./ThrowReturn');
const { isEmpty } = require('./validate');

const generateToken = async (data) => jwt.sign(data, privateKey, {expiresIn: '30m'})

const generateRefreshToken = async (id) => {
    const refreshToken = randToken.uid(256);
    await redisPool.setAsync(refreshToken, id, 'EX', 60 * 30 );
    return refreshToken;
};

const generateTokenOnRefresh = async (refreshToken) => {
    const id = await redisPool.getAsync(refreshToken)
    return id
}

const extendSession = async (key) => {
    const id = await redisPool.getAsync(key)
    if (!isEmpty(id)) await redisPool.setAsync(key, id, 'EX', 60 * 30)
}

const decodeToken = (token) => {
    const formatToken = token.split(' ')[1];
    try {
        return jwt.verify(formatToken, privateKey);
    } catch (error) {
        if(error.message === "jwt expired") throw new ThrowReturn('jwt expired').error_code(401)
        else throw new ThrowReturn('Token Invalid').error_code(498)
    }
};

module.exports = {generateToken, decodeToken, generateRefreshToken, extendSession, generateTokenOnRefresh};
