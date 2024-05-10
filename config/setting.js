require('dotenv').config();
module.exports.server = {
    port: 8899,
    hostname: 'https://api-cms-prod.vcallid.com/',
    host_cdn: '',
};

let mysql = {
    host: process.env.mysql_host ,
    user: process.env.mysql_user ,
    port: process.env.mysql_port ,
    password: process.env.mysql_password,
    timezone: '+7:00',
    decimalNumbers: true,
    connectionLimit: 5,
    multipleStatements: true,
    database: process.env.mysql_database,
};

module.exports.mysql = mysql;
module.exports.redis = {
    port: 6379,
    password: process.env.redis_password,
    host: process.env.redis_host,
    options: {},
    maxConnections: 5,
    handleRedisError: true,
};
module.exports.sequelize = {
	database: mysql.database,
	username: mysql.user,
	password: mysql.password,
	options: {
		host: mysql.host,
		port: mysql.port,
		dialect: 'mysql',
		dialectOptions: {
			decimalNumbers: true,
		},
		operatorsAliases: false,
		timezone: mysql.timezone,
		pool: {
			max: 5,
			min: 0,
			acquire: 30000,
			idle: 10000,
		},
	},
};
module.exports.logger4js = {
	appenders: { out: { type: 'stdout' } },
	categories: { default: { appenders: ['out'], level: 'info' } },
	disableClustering: true,
};

module.exports.OTP_URL =
	'https://api-other-services.vcallid.com/api/v1/other_services';
module.exports.OTP_URL_POINT ='https://api-other-services.vcallid.com/api/v1/payment_point_bonus';
module.exports.T99_URL = 'https://api-backend-t99.vhandicap.com/api/v1/t99_cms';
module.exports.URL_LOGIN = 'https://wghn.vcallid.com/api/v1/webhook';
module.exports.URL_VCALL = 'https://point.vcallid.com/api/v1/cms';
module.exports.URL_VCALL_POINT = 'https://api-payment-dev.vcallid.com/api/v1';
module.exports.T99_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAvxHbc0hp99ruk6JnHBI97c7xDefM206eV7kOVHofNHvT/pJr
+bQxtjD6M1OI56MT4ytgY8x0M/ecq3Gc1JtMWzv2VK6fa9OGtR105LaDxhndV7Ss
JTErbVpzlIR/X6W8VSZ/ujCSQt5GXznJXP/avrQM+o8thTVDDEBEmfEv5h38juz1
L//lCBrL4KXRCvyb1nk1GvGBcA+mHCKRSGv22a9PsWRNjveTveY8VBFBlj8jkrL1
OQ0QCl+tRajIaFOadNYx3S+KTxAYSjYS+vUQuKh7qufNWQmwpAcbDsGHLvuyNNGA
DMMLG8jqJ22H/WY0MEjd4Rf+CTvNlRx3UryKywIDAQABAoIBAHlVy7hP2gtt2mei
kDwBUZZ8/hNIio0SRfeLKxB2ZO6dXCijrzHpPlBmldyWRbBjnTN7zkBSC9Ecgz9U
bLWO0VR2pZ1tLwv4TekiBaNgTBo3Ppp9v3v2148gC5na8lA5HXotcps4UQlpweKi
/b6zM6Q7Dqrm1Y9sHWHgRjBEO5izg6148yd8u4zosLgtTW9A02R3qfhxojNcKKkj
FHINkPXljhWbHVPCu+Gtf6EbIipUTlI5ZzdsRf4pFrAuzlBSljDuj5g1GXppQl0o
nbAl+nH/AYkMcXig5Wy8GiNQWeTOJI+IlYkmDEgeNa7dZiWyUEzsw/y068NquyXV
aNeObaECgYEA9nQFE9JpH6MduXkybfhcPqe2XEetW6vf6G6lzbag2CFf9NHruIbO
6MQ1fs7hUgsYV+uyPyPckZdwy5rGLVSrVYg7xAy3vK6hGKLFzHMqbpZulIpdoQ6h
EXfFSaV47W8PbSQcQtW2OS82RsNmnyYgBmwgR3Or91LJgfgF1WFuiukCgYEAxnif
EjDlJ8dbWOQvL1/x+VQkOtZrBOBCHtvCFyHtjFARny5MF07+2rS9SwGPO/5o18qh
05dQkd8pqDIBVYMixee9OqgGnG66PDQoyyUwqmBea02tYRLTBk5QHsv4XpF0519W
cVqn26RXsuW8jDv3WF/AmjUe6X4S76yvM9FyL5MCgYAQfWjNj7mK7V4Sx+Iw63o4
kv4npIAb7x8XLTgY0Ixoiasi9VzBRvvXJTGzH2KCG83wLAwMH3kloK1iYiO6arzg
BzKAhp1QmZqbzGBRsq73IUea1rs3CISMZ6giqliyAklU8yKU8jm0D82g5HgcU++2
nkt2nG24Kajj8lVplpBP6QKBgGfNBkUZVYBsf5YKIbOBVqi0HQ64vdgbAfnpraUz
lW3hIpZCPIGkSx5PkQD9m9AgyuyxidmENhtUwBC7tn7myvT+srVO08ZVEwoRrZQx
qzYwmLE+OwOeOMf/hV/WBdxP7vhjoG5An7H8TfG+vdIKOt75lV4Rkk1EJts7UZak
YDgJAoGBAIG/jcoAOzOUCubRDZ/1aAfyBMiP9DFMz1ql4bKMgsWo83EIo/GEtHyC
4E7P4vVSDAGI8BuZClil8J4Vv4HplBVo3Kb3BomsRWeJnQ4H2G0k0fScowAK/0+F
qmomlkPn8kh86SqqE3R0EiNTVIvJ56Fs6i4EG208Z/BijY3AShwm
-----END RSA PRIVATE KEY-----`;
module.exports.privateKey = 'admin';
module.exports.vcall_token="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm92aWRlciI6ImNtcyIsImlhdCI6MTY4NDIwNzUzMH0.VJglAmLCAf__mm-zEDEW4EWZ7i3q7Na77EdpQ1-P6edLMTCeVxj72iC8awPElzm2nieHdVOPGqj5WXMVFB4QtTrpQj3d39jFFSkPIhP2dEhh4BjbW6LYmlyncTAfT8xTXvv9ZzvhwPrbaLlkFkqeHhPrF2FduadFJ0iURF5344mTBnxAm3kzdtDAWfFXwgXIZ3u1Yl4IqMP0ActXbgn6YPdmJ-pFjoAgFeNlRxG7vFjBmHxQRUYPAo_gX7GCQLT6I6AgtvWy0NiDxZIJfN28bKRD0SReoDxkhr_xJ9xGTg2UBk5oxWsqsAt_Wk5ixRAwU0rCiE-6mxVMwGs5y-iuBS-TwYhlHWjfwO1vZQOLW6jd8yvsSu-WonPxALFzfXf-CqoueU8lx9hFwBC08rqErlmyhq_iFe9p2QuDHjU27Edh9DO4roo59f1LLjAAhnUK6suSQpBGLn8vWuVIT3fRZGy0voChTKcetsnFp_6qz4r0tJyo0L23cvfIUnK1-qUE6JvuYzgyZcWZAmH57eytYOuZnz9ZLqYXB9UYeWZYjjyst67JG7Vim51YKuuuemLtqgTOPPFEAMsmhz9aJYoLVer-qZW6Uh7188RZFv2PyUNPgrVFQMWE8WjrnSf5nu0gd6vu2e_8O65AmUUJeJtQj2BiinHdPXmxhFLHjhqvz_dQTI9vKDD1yl9qzex_POnpw6wx0m_8PPJyUq0LquSYno6M1V0Iiiok_x8H_NxAA8MbuW0bEHxByCpZuP3XOLzpSnOQiwopiGB2TS1YcMSX5fib9yNfBmifMMK4Icb30XLeHyetUr2ws26ao7Aq22R7aVmXHBZHDNfCldjiNeiPXA"
