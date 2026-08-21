import axios from 'axios';

export default class HooksHandler {
	client;

	queue = [];
	interval;

	badges;

	pronouns = new Map();
	prCache = new Map();

	evtClients = {};

	constructor(client) {
		this.client = client;

		this.client.on('event', (data) => this.queue.push(data));

		this.interval = setInterval(() => this.handleQueue(), 1_000);
	}

	async init() {
		
	}

	async handleQueue() {
		if(!this.queue.length) return;

		let item = this.queue.shift();
		await this.handleEvent(item);
	}

	async sendData(data) {
		if(!process.env.DISCORD_HOOK) return;
		try {
			await axios.post(`${process.env.DISCORD_HOOK}?with_components=true`, {
				flags: 1<<15,
				components: data 
			});
		} catch(e) {
			if(e?.response) {
				console.log(e.response.status, e.response.data);
			}
		}
	}

	async handleEvent({ id, type, data }) {
		let subtype = await SUBS.get(type);
		if(!subtype || !subtype?.hook) return;
		let result = await subtype.hook(data.event);

		this.sendData(result);
	}
}