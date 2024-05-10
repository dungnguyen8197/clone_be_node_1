class ThrowReturn extends Error {
    constructor(message, ...args) {
        super(message);
        this.name = 'ThrowReturn';
        this.code = 1;
        this.args = args;
        this.lang = undefined;
    }

    static create(...args){
        return new ThrowReturn(...args);
    }

    error_code(code){
        this.code = code;
        return this;
    }

    language(lang){
        this.lang = lang;
        return this;
    }

    params(...args){
        this.args = args;
        return this;
    }
}


module.exports = ThrowReturn;