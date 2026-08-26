export default class PingCommand {
	client;

	name = 'ping';
	description = "Ping the bot";

	constructor(client) {
		this.client = client;
	}

	execute({ username }) {
		return `@${username} pong!`;
	}
}