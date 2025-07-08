import btoa from "btoa";
import { Request, Response } from "express";
import njwt from "njwt";
import fetch from "node-fetch";
import path from "path";

import { RouteResources } from "../api.js";

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT = process.env.REDIRECT_V2;
const REDIRECT_ENCODED = encodeURIComponent(REDIRECT);
function _encode(obj) {
	let string = "";

	for (const [key, value] of Object.entries(obj)) {
		if (!value) continue;
		// @ts-ignore
		string += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
	}

	return string.substring(1);
}

export default function ({ app }: RouteResources) {
	return [
		{
			method: "get",
			route: "/v2/login",
			handler: async function (req: Request, res: Response) {
				res.sendFile(path.resolve("../pages/login.html"));
			}
		},
		{
			method: "get",
			route: "/v2/return",
			handler: async function (req: Request, res: Response) {
				res.sendFile(path.resolve("../pages/login.html"));
			}
		},
		{
			method: "get",
			route: "/v2/logout",
			handler: async function (req: Request, res: Response) {
				res.sendFile(path.resolve("../pages/logout.html"));
			}
		},
		{
			method: "get",
			route: "/v2/OAuth2",
			handler: async function (req: Request, res: Response) {
				if (req.cookies.session) {
					const token = await app.fetchServiceToken(req.cookies.session, req.cookies.service);
					if (token) {
						return res.redirect(`/v2/return?token=${token}`);
					}
				}
				res.redirect(
					`https://discordapp.com/api/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify&response_type=code&redirect_uri=${REDIRECT_ENCODED}`
				);
			}
		},
		{
			method: "get",
			route: "/v2/getuser/:token",
			handler: async function (req: Request, res: Response) {
				const serviceName = req.query.service;
				if (!serviceName) return res.sendStatus(400);

				const user = await app.fetchUserFromToken(req.params.token, serviceName.toString());
				if (!user) res.sendStatus(403);
				else res.send(user);
			}
		},
		{
			method: "get",
			route: "/v2/callback",
			handler: async function (req: Request, res: Response) {
				if (!req.query.code) {
					return res.sendStatus(400);
				}
				console.log(`V2 auth completed!`);
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
				const discordUserData = await discordData.json();
				if (!discordUserData.id) return res.sendStatus(500);
				discordUserData.roles = await app.getUserRoles(discordUserData.id);
				discordUserData.originalUrl = req.cookies.service;

				const session = await app.createSession(discordUserData);
				res.cookie("session", session.token);
				res.redirect(`/v2/return`);
			}
		},
		{
			route: "/roles/:id",
			method: "get",
			handler: async function (req: Request, res: Response) {
				const userId = req.params.id;
				if (!userId) return res.sendStatus(400);
				const roles = await app.getUserRoles(userId);
				res.send(roles);
			}
		},
		{
			route: "/members/:guildId/:roleId",
			method: "get",
			handler: async function (req: Request, res: Response) {
				const guildId = req.params.guildId;
				const roleId = req.params.roleId;
				if (!guildId || !roleId) return res.sendStatus(400);
				const members = await app.getMembersWithRole(guildId, roleId);
				res.send(members);
			}
		}
	];
}
