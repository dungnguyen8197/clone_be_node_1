let config = require('./config/setting');
let bodyParser = require('body-parser');
let express = require('express');
let app = express();
let path = require('path');
let fs = require('fs');
let log4js = require('log4js');
let logger = require('./src/utils/logger').log;
const cors = require('cors');
const fileUpload = require('express-fileupload')

app.use(bodyParser.json());
app.use(cors());
app.use(fileUpload())
function logResponseBody(req, res, next) {
	let oldWrite = res.send;
	let chunks = [];

	if (req.method === 'POST') {
		// Log post data
		if (req.body) logger.info('POST DATA: ', JSON.stringify(req.body));
		if (req.file) logger.info('POST FILE: ', JSON.stringify(req.file));
	}

	res.send = function (chunk) {
		if (typeof chunk === 'object' && !(chunk instanceof Buffer))
			chunk = JSON.stringify(chunk);

		chunks.push(new Buffer(chunk));
		oldWrite.apply(res, [chunk]);
	};

	res.on('finish', () => {
		let body = Buffer.concat(chunks).toString('utf8');
		logger.info('RETURN', body);
	});
	next();
}
app.use(express.static(path.join(__dirname, 'public')));
app.use(log4js.connectLogger(logger, { level: log4js.levels.INFO }));
app.use(logResponseBody);
// Tự động tạo routing
let routeFiles = path.join(__dirname, './src/router');
fs.readdirSync(routeFiles)
	.filter((name) => {
		return name.toLowerCase().endsWith('.router.js');
	})
	.map((name) => name.replace('.js', ''))
	.forEach((name) => {
		const routeName = `./src/router/${name}`;
		let routerPath =
			name === 'index.router' ? '' : `/${name.replace('.router', '')}`;
		const urlPath = `${routerPath}`;
		console.log(`Auto load: ${routeName} -> ${urlPath}`);
		app.use(urlPath, require(routeName));
	});
app.listen(config.server.port);
module.exports = app;
