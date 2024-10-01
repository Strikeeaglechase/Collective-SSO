import { randomBytes } from "crypto";
import FrameworkClient from "strike-discord-framework";
import { CollectionManager } from "strike-discord-framework/dist/collectionManager.js";
import Logger from "strike-discord-framework/dist/logger.js";
import { v4 as uuidv4 } from "uuid";

const MAX_SESSION_TIME = 4 * 7 * 24 * 60 * 60 * 1000;
function newToken() {
	return randomBytes(48).toString("hex");
}

interface Session {
	id: string;
	userId: string;
	serviceTokens: { name: string; token: string }[];
	lastUsed: number;
	token: string;
	data: DiscordUserData;
}

interface DiscordUserData {
	id: string;
	username: string;
	avatar: string;
	avatar_decoration: null;
	discriminator: string;
	public_flags: number;
	flags: number;
	banner: string;
	banner_color: null;
	accent_color: null;
	locale: string;
	mfa_enabled: boolean;
	premium_type: number;
	originalUrl: string;
	roles: {
		discordId: string;
		roles: string[];
	}[];
}

class Application {
	public framework: FrameworkClient;
	private sessions: CollectionManager<string, Session>;
	public log: Logger;

	public async init(framework: FrameworkClient) {
		this.framework = framework;
		this.log = framework.log;
		this.sessions = await this.framework.database.collection("sessions", false, "id");
	}

	public async createSession(data: DiscordUserData): Promise<Session> {
		const existing = await this.sessions.collection.findOne({
			userId: data.id
		});
		if (existing) await this.sessions.remove(existing.id);

		const session: Session = {
			id: uuidv4(),
			userId: data.id,
			serviceTokens: [],
			lastUsed: Date.now(),
			token: newToken(),
			data: data
		};
		this.log.info(`User ${data.username} (${data.id}) logged in. Session ID ${session.id}`);

		await this.sessions.add(session);

		return session;
	}

	public async fetchServiceToken(token: string, service: string): Promise<string | null> {
		if (typeof token != "string") throw new Error(`${token} is not a valid token!`);

		const session = await this.sessions.collection.findOne({ token: token });
		if (!session) return null;
		if (Date.now() - session.lastUsed > MAX_SESSION_TIME) return null;

		const serviceName = new URL(service).hostname;
		if (!serviceName) return null;
		const serviceTok = session.serviceTokens.find(service => service.name == serviceName);
		if (!serviceTok) session.serviceTokens.push({ name: serviceName, token: newToken() });

		session.lastUsed = Date.now();
		await this.sessions.update(session, session.id);

		return session.serviceTokens.find(service => service.name == serviceName).token;
	}

	public async fetchUserFromToken(token: string, service: string): Promise<DiscordUserData | null> {
		const session = await this.sessions.collection.findOne({
			serviceTokens: { name: service, token: token }
		});
		if (!session) return null;
		if (Date.now() - session.lastUsed > MAX_SESSION_TIME) return null;

		return session.data;
	}

	public async getUserRoles(userId: string) {
		const roleInfo: { discordId: string; roles: string[] }[] = [];

		const prom = this.framework.client.guilds.cache.map(async guild => {
			const guildObj = { discordId: guild.id, roles: [] };
			const member = await guild.members.fetch(userId).catch(() => {});
			if (!member) return;
			member.roles.cache.map(role => guildObj.roles.push(role.id));

			roleInfo.push(guildObj);
		});

		await Promise.all(prom);

		return roleInfo;
	}

	public async getMembersWithRole(guildId: string, roleId: string): Promise<string[]> {
		const guild = await this.framework.client.guilds.fetch(guildId).catch(() => {});
		if (!guild) return [];

		const role = guild.roles.cache.get(roleId);
		if (!role) return [];

		return role.members.map(member => member.id);
	}
}

export { Application, DiscordUserData };
