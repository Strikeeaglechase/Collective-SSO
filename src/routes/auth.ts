import btoa from "btoa";
import { Request, Response } from "express";
import njwt, { JSONValue } from "njwt";
import fetch from "node-fetch";
import path from "path";
import { v4 as uuidv4 } from "uuid";

import { RouteResources } from "../api.js";
import { DiscordUserData } from "../app.js";

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT = process.env.REDIRECT;
const REDIRECT_ENCODED = encodeURIComponent(REDIRECT);
const JWT_KEY = process.env.KEY;
const EXPR_TIME = 1000 * 60 * 60 * 24; // 1hr
function _encode(obj) {
	let string = "";

	for (const [key, value] of Object.entries(obj)) {
		if (!value) continue;
		// @ts-ignore
		string += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
	}

	return string.substring(1);
}

let lookupIds = [];

function addLookup(user: DiscordUserData) {
	const id = uuidv4();
	const lookup = {
		id: id,
		user: user,
		exp: Date.now() + 30 * 1000 // only valid for 30seconds
	};
	lookupIds.push(lookup);
	return id;
}

export default function ({ app }: RouteResources) {
	return [
		{
			method: "get",
			route: "/login",
			handler: async function (req: Request, res: Response) {
				res.sendFile(path.resolve("../pages/login.html"));
			}
		},
		{
			method: "get",
			route: "/return",
			handler: async function (req: Request, res: Response) {
				res.sendFile(path.resolve("../pages/login.html"));
			}
		},
		{
			method: "get",
			route: "/logout",
			handler: async function (req: Request, res: Response) {
				res.sendFile(path.resolve("../pages/logout.html"));
			}
		},
		{
			method: "get",
			route: "/OAuth2",
			handler: async function (req: Request, res: Response) {
				res.redirect(
					`https://discordapp.com/api/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify&response_type=code&redirect_uri=${REDIRECT_ENCODED}`
				);
			}
		},
		{
			method: "get",
			route: "/getuser/:lookupID",
			handler: async function (req: Request, res: Response) {
				lookupIds = lookupIds.filter(l => Date.now() < l.exp);
				const code = req.params.lookupID;
				if (!code) return res.sendStatus(400);
				const lookup = lookupIds.find(l => l.id == code);
				if (!lookup) return res.sendStatus(400);
				lookup.exp = 0; //Makes the code a one time use
				res.send(lookup.user);
			}
		},
		{
			method: "get",
			route: "/callback",
			handler: async function (req: Request, res: Response) {
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
					scope: "identify"
				};
				const response = await fetch(`https://discordapp.com/api/oauth2/token`, {
					method: "POST",
					headers: {
						"Authorization": `Basic ${creds}`,
						"Content-Type": "application/x-www-form-urlencoded"
					},
					body: _encode(data)
				});
				const json = await response.json();
				const discordData = await fetch("https://discordapp.com/api/users/@me", {
					method: "GET",
					headers: {
						Authorization: `Bearer ${json.access_token}`
					}
				});
				const discordUserData = (await discordData.json()) as DiscordUserData;
				if (!discordUserData.id) return res.sendStatus(500);

				discordUserData.roles = await app.getUserRoles(discordUserData.id);
				discordUserData.originalUrl = req.cookies.service;

				const lookupID = addLookup(discordUserData);

				const userJwt = njwt.create(
					{
						user: discordUserData as unknown as JSONValue
					},
					JWT_KEY
				);
				userJwt.setExpiration(Date.now() + EXPR_TIME);

				res.redirect(`/return?code=${lookupID}`);
			}
		}
	];
}
