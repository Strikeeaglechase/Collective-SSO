var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import cookieParser from "cookie-parser";
import express from "express";
import fs from "fs";
import forEach from "./asyncForeach.js";
function setupAPI(application) {
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
    const resources = { app: application };
    loadRoutes(app, application, resources);
    app.listen(process.env.PORT, () => application.log.info(`SSO Server up on port ${process.env.PORT}!`));
}
function loadRoutes(api, application, resources) {
    return __awaiter(this, void 0, void 0, function* () {
        const dir = "./routes/";
        const files = fs.readdirSync(dir);
        application.log.info("Loading routes");
        yield forEach(files, (file) => __awaiter(this, void 0, void 0, function* () {
            //Pass in the resources to each endpoint, and get back an array of routes
            const loaderFunction = yield import(dir + file);
            const endpoints = loaderFunction.default(resources);
            endpoints.forEach((endpoint) => {
                api[endpoint.method](endpoint.route, endpoint.handler);
                application.log.info(`Route loaded: (${endpoint.method}) ${endpoint.route}`);
            });
        }), false);
        application.log.info("Routes fully loaded");
    });
}
export { setupAPI };
