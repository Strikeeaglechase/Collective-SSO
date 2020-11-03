const fetch = require("node-fetch");
const path = require("path");
const btoa = require("btoa");
const uuidv4 = require("uuid").v4;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT = process.env.REDIRECT;
const REDIRECT_ENCODED = encodeURIComponent(REDIRECT);

function _encode(obj) {
	let string = "";

	for (const [key, value] of Object.entries(obj)) {
		if (!value) continue;
		string += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
	}

	return string.substring(1);
}

let lookupIds = [];

module.exports = function () {
	return [{
			method: "get",
			route: "/login",
			handler: async function (req, res) {
				res.sendFile(path.resolve("./pages/login.html"));
			},
		},
		{
			method: "get",
			route: "/OAuth2",
			handler: async function (req, res) {
				res.redirect(
					`https://discordapp.com/api/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify&response_type=code&redirect_uri=${REDIRECT_ENCODED}`
				);
			},
		},
		{
			method: "get",
			route: "/getuser/:lookupID",
			handler: async function (req, res) {
				lookupIds = lookupIds.filter((l) => Date.now() < l.exp);
				const code = req.params.lookupID;
				if (!code) return res.sendStatus(400);
				const lookup = lookupIds.find((l) => l.id == code);
				if (!lookup) return res.sendStatus(400);
				lookup.exp = 0; //Makes the code a one time use
				res.send(lookup.user);
			},
		},
		{
			method: "get",
			route: "/return",
			handler: async function (req, res) {
				res.sendFile(path.resolve("./pages/return.html"));
			},
		},
		{
			method: "get",
			route: "/callback",
			handler: async function (req, res) {
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
				const response = await fetch(
					`https://discordapp.com/api/oauth2/token`, {
						method: "POST",
						headers: {
							Authorization: `Basic ${creds}`,
							"Content-Type": "application/x-www-form-urlencoded",
						},
						body: _encode(data),
					}
				);
				const json = await response.json();
				const discordData = await fetch(
					"http://discordapp.com/api/users/@me", {
						method: "GET",
						headers: {
							Authorization: `Bearer ${json.access_token}`,
						},
					}
				);
				const discordUserData = await discordData.json();
				if (!discordUserData.id) return res.sendStatus(500);
				const user = {
					id: discordUserData.id,
					username: discordUserData.username,
				};
				const lookup = {
					id: uuidv4(),
					user: user,
					exp: Date.now() + 30 * 1000, // only valid for 30seconds
				};
				lookupIds.push(lookup);
				res.redirect(`/return?code=${lookup.id}`);
			},
		},
	];
};