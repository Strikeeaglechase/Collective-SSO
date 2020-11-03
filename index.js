require("dotenv").config();
const fs = require("fs");
const log = require("./logger.js");
const express = require("express");
const app = express();

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