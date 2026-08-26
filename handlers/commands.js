import { getSystem, getProxiedMessage } from 'pluralmind';
import { ENDPOINTS, EMOTES } from '../constants.js';
import axios from 'axios';
import { readdirSync } from 'node:fs';
import db from './data.js';

// handles all of the code for commands
export default class CommandsHandler {
	client;
	token;
	db = db;

	dailies = {};
	commands = new Map();
	timeouts = new Map();

	constructor(client) {
		this.client = client;
		this.token = client.botToken;

		this.client.on('chat', (data) => this.handleChat(data));
		this.client.on('tokenUpdate', (data) => this.token = data.botToken);
	}

	async init() {
		let base = `${import.meta.dirname}/../commands`
		let files = readdirSync(base);

		for(let f of files) {
			let mod = await import(`file://${base}/${f}`);
			console.log(mod);
			let cmd = new mod.default(this)
			this.commands.set(cmd.name, cmd);
		}
	}

	async sendData(message) {
		try {
			await this.client.reqClient.post(ENDPOINTS.SEND_MESSAGE(), {
				broadcaster_id: process.env.USER_ID,
				sender_id: process.env.BOT_ID,
				message
			}, {
				headers: {
					'Authorization': `Bearer ${this.token}`
				}
			})
		} catch(e) {
			if(e?.response) console.log(e.response.data);
			else console.log(e);
		}
	}

	async handleChat({ id, data: { event } }) {
		let {
			message: { fragments: frags },
			message_type: mtype,
			chatter_user_name: username,
			chatter_user_id: userid,
		} = event;
		if(mtype !== "text") return;
		if(userid == process.env.BOT_ID) return;

		let type, msg, prns;
		let preq;
		let full = frags.filter(x => x.text?.length).map(x => x.text).join(" ");
		if(!full.startsWith(process.env.PREFIX)) return;
		let args = full.split(" ");

		let cmd = this.commands.get(args[0].replace(process.env.PREFIX, ""));
		if(!cmd) return;

		let result = await cmd.execute({
			username,
			userid,
			args: args.slice(1)
		})
		await this.sendData(result);
	}
}