import cookieParser from "cookie-parser";
import express, { Request, Response } from "express";
import fs from "fs";

import { Application } from "./app.js";
import forEach from "./asyncForeach.js";

interface APIRoute {
	method: "get" | "post";
	route: string;
	handler: (req: Request, res: Response) => void | Promise<void>;
}

interface RouteImport {
	default: (resoruces: RouteResources) => APIRoute[];
}

interface RouteResources {
	app: Application;
}

function setupAPI(application: Application) {
	const app = express();
	app.use(cookieParser());
	app.use((req, res, next) => {
		const ip = req.headers["cf-connecting-ip"] ?
			req.headers["cf-connecting-ip"] :
			req.ip;
		const body = JSON.stringify(req.body);
		const logMsg = `[${ip}]: (${req.method}) ${req.path} ${JSON.stringify(req.query)} ${body}`;
		application.log.info(logMsg);
		next();
	});


	const resources: RouteResources = { app: application };
	loadRoutes(app, application, resources);

	app.listen(process.env.PORT, () =>
		application.log.info(`SSO Server up on port ${process.env.PORT}!`)
	);
}


async function loadRoutes(api: express.Express, application: Application, resources: RouteResources) {
	const dir = "./routes/";
	const files = fs.readdirSync(dir);
	application.log.info("Loading routes");
	await forEach(files, async file => {
		//Pass in the resources to each endpoint, and get back an array of routes
		const loaderFunction: RouteImport = await import(dir + file);
		const endpoints: APIRoute[] = loaderFunction.default(resources);
		endpoints.forEach((endpoint) => {
			api[endpoint.method](endpoint.route, endpoint.handler);
			application.log.info(`Route loaded: (${endpoint.method}) ${endpoint.route}`);
		});
	}, false);
	application.log.info("Routes fully loaded");
}

export { setupAPI, RouteResources };
