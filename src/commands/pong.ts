import { Command, CommandEvent } from "strike-discord-framework/dist/command.js";

class Ping extends Command {
	name: string;
	help: {
		msg: string;
	};

	async run(event: CommandEvent) {
		return event.framework.success("Pong!");
	};
}
export default Ping;