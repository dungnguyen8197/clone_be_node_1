const bcrypt = require("bcryptjs");
const { isEmpty } = require("./validate");

const encodePassword = (password) =>
    new Promise((resolve, reject) => {
        bcrypt.hash(password, 8, function (error, hash) {
            if (hash) {
                resolve(hash);
            } else {
                reject(`Password: ${error}`);
            }
        });
    });

const comparePassword = (password, encodePassword) =>
    new Promise((resolve, reject) => {
        bcrypt.compare(encodePassword, password).then(async (isValid) => {
            if (!isValid || isEmpty(isValid)) {
                reject("Phone or password incorrect");
            } else {
                resolve();
            }
        });
    });

module.exports = { encodePassword, comparePassword };
