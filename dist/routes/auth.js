var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import btoa from "btoa";
import njwt from "njwt";
import fetch from "node-fetch";
import path from "path";
import { v4 as uuidv4 } from "uuid";
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT = process.env.REDIRECT;
const REDIRECT_ENCODED = encodeURIComponent(REDIRECT);
const JWT_KEY = process.env.KEY;
const EXPR_TIME = 1000 * 60 * 60 * 24; // 1hr
function _encode(obj) {
    let string = "";
    for (const [key, value] of Object.entries(obj)) {
        if (!value)
            continue;
        // @ts-ignore
        string += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }
    return string.substring(1);
}
let lookupIds = [];
function addLookup(user) {
    const id = uuidv4();
    const lookup = {
        id: id,
        user: user,
        exp: Date.now() + 30 * 1000, // only valid for 30seconds
    };
    lookupIds.push(lookup);
    return id;
}
export default function ({ app }) {
    return [{
            method: "get",
            route: "/login",
            handler: function (req, res) {
                return __awaiter(this, void 0, void 0, function* () {
                    res.sendFile(path.resolve("../pages/login.html"));
                });
            },
        },
        {
            method: "get",
            route: "/return",
            handler: function (req, res) {
                return __awaiter(this, void 0, void 0, function* () {
                    res.sendFile(path.resolve("../pages/login.html"));
                });
            },
        },
        {
            method: "get",
            route: "/logout",
            handler: function (req, res) {
                return __awaiter(this, void 0, void 0, function* () {
                    res.sendFile(path.resolve("../pages/logout.html"));
                });
            },
        },
        {
            method: "get",
            route: "/OAuth2",
            handler: function (req, res) {
                return __awaiter(this, void 0, void 0, function* () {
                    res.redirect(`https://discordapp.com/api/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify&response_type=code&redirect_uri=${REDIRECT_ENCODED}`);
                });
            },
        },
        {
            method: "get",
            route: "/getuser/:lookupID",
            handler: function (req, res) {
                return __awaiter(this, void 0, void 0, function* () {
                    lookupIds = lookupIds.filter((l) => Date.now() < l.exp);
                    const code = req.params.lookupID;
                    if (!code)
                        return res.sendStatus(400);
                    const lookup = lookupIds.find((l) => l.id == code);
                    if (!lookup)
                        return res.sendStatus(400);
                    lookup.exp = 0; //Makes the code a one time use
                    res.send(lookup.user);
                });
            },
        },
        {
            method: "get",
            route: "/callback",
            handler: function (req, res) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!req.query.code) {
                        return res.sendStatus(400);
                    }
                    const code = req.query.code;
                    const creds = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
                    const data = {
                        client_id: CLIENT_ID,
                        client_secret: CLIENT_SECRET,
                        grant_type: "authorization_code",
                        code: code,
                        redirect_uri: REDIRECT,
                        scope: "identify",
                    };
                    const response = yield fetch(`https://discordapp.com/api/oauth2/token`, {
                        method: "POST",
                        headers: {
                            Authorization: `Basic ${creds}`,
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                        body: _encode(data),
                    });
                    const json = yield response.json();
                    const discordData = yield fetch("https://discordapp.com/api/users/@me", {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${json.access_token}`,
                        },
                    });
                    const discordUserData = yield discordData.json();
                    if (!discordUserData.id)
                        return res.sendStatus(500);
                    discordUserData.roles = yield app.getUserRoles(discordUserData.id);
                    discordUserData.originalUrl = req.cookies.service;
                    const lookupID = addLookup(discordUserData);
                    const userJwt = njwt.create({
                        user: discordUserData
                    }, JWT_KEY);
                    userJwt.setExpiration(Date.now() + EXPR_TIME);
                    res.redirect(`/return?code=${lookupID}`);
                });
            },
        }];
}
;
