var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { randomBytes } from "crypto";
import { v4 as uuidv4 } from "uuid";
const MAX_SESSION_TIME = 4 * 7 * 24 * 60 * 60 * 1000;
function newToken() {
    return randomBytes(48).toString("hex");
}
class Application {
    init(framework) {
        return __awaiter(this, void 0, void 0, function* () {
            this.framework = framework;
            this.log = framework.log;
            this.sessions = yield this.framework.database.collection("sessions", false, "id");
        });
    }
    createSession(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = yield this.sessions.collection.findOne({ userId: data.id });
            if (existing)
                yield this.sessions.remove(existing.id);
            const session = {
                id: uuidv4(),
                userId: data.id,
                serviceTokens: [],
                lastUsed: Date.now(),
                token: newToken(),
                data: data
            };
            this.log.info(`User ${data.username} (${data.id}) logged in. Session ID ${session.id}`);
            yield this.sessions.add(session);
            return session;
        });
    }
    fetchServiceToken(token, service) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof token != "string")
                throw new Error(`${token} is not a valid token!`);
            const session = yield this.sessions.collection.findOne({ token: token });
            if (!session)
                return null;
            if (Date.now() - session.lastUsed > MAX_SESSION_TIME)
                return null;
            const serviceName = new URL(service).hostname;
            if (!serviceName)
                return null;
            const serviceTok = session.serviceTokens.find(service => service.name == serviceName);
            if (!serviceTok)
                session.serviceTokens.push({ name: serviceName, token: newToken() });
            session.lastUsed = Date.now();
            yield this.sessions.update(session, session.id);
            return session.serviceTokens.find(service => service.name == serviceName).token;
        });
    }
    fetchUserFromToken(token, service) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.sessions.collection.findOne({
                serviceTokens: { name: service, token: token }
            });
            if (!session)
                return null;
            if (Date.now() - session.lastUsed > MAX_SESSION_TIME)
                return null;
            return session.data;
        });
    }
    getUserRoles(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const roleInfo = [];
            const prom = this.framework.client.guilds.cache.map((guild) => __awaiter(this, void 0, void 0, function* () {
                const guildObj = { discordId: guild.id, roles: [] };
                const member = yield guild.members.fetch(userId).catch(() => { });
                if (!member)
                    return;
                member.roles.cache.map(role => guildObj.roles.push(role.id));
                roleInfo.push(guildObj);
            }));
            yield Promise.all(prom);
            return roleInfo;
        });
    }
}
export { Application };
