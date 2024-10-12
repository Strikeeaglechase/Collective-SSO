var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { IntentsBitField, Partials } from "discord.js";
import { config } from "dotenv";
import FrameworkClient from "strike-discord-framework";
import { setupAPI } from "./api.js";
import { Application } from "./app.js";
config();
const f = IntentsBitField.Flags;
const frameworkOptions = {
    commandsPath: `${process.cwd()}/commands/`,
    databaseOpts: {
        databaseName: "sso" + (process.env.IS_DEV == "true" ? "-dev" : ""),
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
        intents: f.Guilds | f.GuildMembers | f.GuildModeration | f.MessageContent | f.DirectMessages,
        partials: [Partials.Channel, Partials.GuildMember, Partials.Message]
    },
    defaultPrefix: "$",
    name: "SSO",
    token: process.env.BOT_TOKEN,
    ownerID: "272143648114606083",
    dmPrefixOnPing: true,
    dmErrorSilently: false,
    permErrorSilently: false
};
const frameClient = new FrameworkClient(frameworkOptions);
const application = new Application();
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        yield frameClient.init(application);
        yield application.init(frameClient);
        // await frameClient.loadBotCommands(`${process.cwd()}/../node_modules/strike-discord-framework/dist/defaultCommands/`);
        setupAPI(application);
        // await frameClient.permissions.setPublic("command.misc", true);
        process.on("unhandledRejection", error => {
            application.log.error(error);
        });
        process.on("uncaughtException", error => {
            application.log.error(error);
        });
    });
}
init();
