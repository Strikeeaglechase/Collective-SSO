import cookieParser from "cookie-parser";
import Discord from "discord.js";
import { config } from "dotenv";
import express from "express";
import fs from "fs";
import FrameworkClient from "strike-discord-framework";
import { FrameworkClientOptions } from "strike-discord-framework/dist/interfaces.js";

import { setupAPI } from "./api.js";
import { Application } from "./app.js";
import forEach from "./asyncForeach.js";

config();



const frameworkOptions: FrameworkClientOptions = {
	commandsPath: `${process.cwd()}/commands/`,
	databaseOpts: {
		databaseName: "nut-counter" + (process.env.IS_DEV == "true" ? "-dev" : ""),
		url: process.env.DB_URL
	},
	loggerOpts: {
		filePath: `${process.cwd()}/../logs/`,
		logChannels: {
			INFO: process.env.LOG_CHANNEL,
			ERROR: process.env.ERR_CHANNEL,
			WARN: process.env.ERR_CHANNEL
		},
		logToFile: true
	},
	clientOptions: {
		intents: Object.keys(Discord.Intents.FLAGS) as Discord.IntentsString[],
		partials: ["CHANNEL", "MESSAGE"]
	},
	defaultPrefix: "$",
	name: "Nut Counter",
	token: process.env.BOT_TOKEN,
	ownerID: "272143648114606083",
	dmPrefixOnPing: true,
	dmErrorSilently: false,
	permErrorSilently: false,
};
const frameClient = new FrameworkClient(frameworkOptions);
const application = new Application();

async function init() {
	await frameClient.init(application);
	await application.init(frameClient);
	await frameClient.loadBotCommands(`${process.cwd()}/../node_modules/strike-discord-framework/dist/defaultCommands/`);
	setupAPI(application);
	// await frameClient.permissions.setPublic("command.misc", true);

	process.on("unhandledRejection", (error) => {
		application.log.error(error);
	});
	process.on("uncaughtException", (error) => {
		application.log.error(error);
	});
}

init();
