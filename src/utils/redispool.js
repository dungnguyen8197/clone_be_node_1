var redis = require('redis');
var bluebird = require('bluebird');
var config = require('../../config/setting');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);


const delay = ms => new Promise(res => setTimeout(res, ms));

/**
 * RedisPool singleton class
 */
class RedisPool {


    /**
     * pool init
     * @param  {object} options redis options,
     *                          add maxConnections to create the number of client
     * @return {[type]}         [description]
     */
    static init(options = undefined) {

        //client collection pool
        this.pool = Array(options.maxConnections)
            .fill(null)
            .map(() => redis.createClient(options));


        //add some useful function to redis client
        this.pool.forEach(rd => {
            rd.getIntAsync = async function (key, defaultValue = 0) {
                let value = await rd.getAsync(key);
                return parseInt(value || defaultValue);
            };

            rd.getFloatAsync = async function (key, defaultValue = 0) {
                let value = await rd.getAsync(key);
                return parseFloat(value || defaultValue);
            };
            rd.release = function () {
                RedisPool.release(rd);
            }
        });

        //wrapper all client query commands
        Object
            .getOwnPropertyNames(redis.RedisClient.prototype)
            .filter(name => name.endsWith('Async'))
            .forEach(name => {
                this[name] = (...args) => this.command(name, ...args);
            });

        return this;
    }

    /**
     * wrapper client query command.
     * This function pop one client, query command with
     * this client and push it back to pool
     *
     * @param  {[type]}    name the name of command
     * @param  {...[type]} args parameters of command
     * @return {[type]}         [description]
     */
    static async command(name, ...args) {
        let rd = await this.getClient(false);
        try {
            let ret = await rd[name](...args);
            this.release(rd);
            return ret;
        } catch (err) {
            this.release(rd);
            throw err;
        }
    }

    /**
     * @brief pop one client.
     *
     * This function wait until get and pop one connection
     *
     * @param  {Number} msWaitStep [description]
     * @return {[type]}            [description]
     */
    static async getClient(autoRelease = true, msWaitStep = 1) {
        if (!this.pool) this.init({maxConnections: 5});

        //wait until pool has at least one connection
        while (!this.pool.length)
            await delay(msWaitStep);

        let rd = this.pool.pop();

        if (autoRelease) setTimeout(() => this.release(rd), 5 * 1000);

        return rd;
    }

    /**
     * push client to pool
     *
     * @param  {[type]} client [description]
     * @return {[type]}    [description]
     */
    static release(client) {
        if (!this.pool) throw new Error("Please call 'init' method first");

        if (!this.pool.includes(client)) this.pool.push(client);
    }
}


RedisPool.pop = RedisPool.getClient;
RedisPool.push = RedisPool.release;

RedisPool.init(config.redis);

module.exports = RedisPool;