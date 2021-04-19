require("dotenv").config();
const fs = require("fs");
const log = require("./logger.js");
const express = require("express");
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());
app.use((req, res, next) => {
	const ip = req.headers["cf-connecting-ip"] ?
		req.headers["cf-connecting-ip"] :
		req.ip;
	const body = JSON.stringify(req.body);
	const logMsg = `[${ip}]: (${req.method}) ${req.path} ${JSON.stringify(req.query)} ${body}`;
	log(logMsg);
	next();
});

function loadRoutes() {
	const dir = "./routes/";
	const files = fs.readdirSync(dir);
	files.forEach((file) => {
		//Pass in the resources to each endpoint, and get back an array of routes
		const endpoints = require(dir + file)();
		endpoints.forEach((endpoint) => {
			app[endpoint.method](endpoint.route, endpoint.handler);
			log(`Route loaded: (${endpoint.method}) ${endpoint.route}`);
		});
	});
}
loadRoutes();
app.listen(process.env.PORT, () =>
	log(`SSO Server up on port ${process.env.PORT}!`)
);