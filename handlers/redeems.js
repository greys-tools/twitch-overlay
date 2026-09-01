import { ENDPOINTS } from '../constants.js';
import { readdirSync } from 'node:fs';
import db from './data.js';

// handles all of the code for commands
export default class RedeemsHandler {
	client;
	token;
	db = db;

	dailies = {};
	commands = new Map();
	timeouts = new Map();

	constructor(client) {
		this.client = client;
		this.token = client.botToken;

		this.client.on('redeem', (data) => this.handleRedeem(data));
		this.client.on('tokenUpdate', (data) => this.token = data.botToken);
	}

	async init() {
		let base = `${import.meta.dirname}/../redeems`
		let files = readdirSync(base);

		for(let f of files) {
			let mod = await import(`file://${base}/${f}`);
			console.log(mod);
			let cmd = new mod.default(this)
			this.commands.set(cmd.title, cmd);
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

	async handleRedeem({ id, data: { event } }) {
		let {
			user_id: userid,
			user_name: username,
			reward
		} = event;

		let {
			title
		} = reward;

		if(userid == process.env.BOT_ID) return;

		let cmd = this.commands.get(title);
		if(!cmd) return;

		let result = await cmd.execute({
			username,
			userid,
		})

		if(result) await this.sendData(result);
	}
}