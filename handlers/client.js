import { EventEmitter } from 'node:events';
import axios from 'axios';
import { nanoid } from 'nanoid';
import { getSystem, getProxiedMessage } from 'pluralmind';
import { SOCKET, ENDPOINTS, EMOTES } from '../constants.js';
import Subscriptions from '../subscriptions/index.js';
import { DatabaseSync } from 'node:sqlite';

let SUBS = new Map();

export default class Client extends EventEmitter {
	reqClient = axios.create({
		baseURL: ENDPOINTS.BASE(),
		headers: {
			"Client-Id": process.env.CLIENT_ID,
		},
	})

	db = new DatabaseSync(`${import.meta.dirname}/../db.sqlite`);
	ws;
	queue = [];
	connected = false;
	interval;
	refreshInterval;

	appToken;
	userToken;
	badges;

	pronouns = new Map();
	prCache = new Map();

	evtClients = {};

	constructor() {
		super();

		this.on('connected', ({ session_id }) => this.setSubs(session_id));
		this.on('event', (data) => this.handleEvent(data));
		this.on('chat', (data) => this.handleChat(data));
		this.interval = setInterval(() => this.handleQueue(), 3_000);

		// refresh tokens every 60m just to be safe
		// twitch recommends hourly refresh/validation like this
		this.refreshInterval = setInterval(async () => {
			this.userToken = await this.getUserToken();
			this.appToken = await this.getAppToken();
		}, 60 * 60 * 1_000);
	}

	async init() {
		this.appToken = await this.getAppToken();
		console.log(this.appToken);
		this.userToken = await this.getUserToken();

		this.ws = new WebSocket(SOCKET);
		this.ws.addEventListener('message', async (msg) => {
			let { metadata, payload: data } = JSON.parse(msg.data);
			if(data?.session?.id) {
				this.connected = true;
				this.emit('connected', { session_id: data.session.id })
			} else {
				if(metadata?.message_type == "notification") {
					if(metadata.subscription_type == 'channel.chat.message') {
						this.emit('chat', { id: nanoid(10), data });
					} else this.queue.push({ id: nanoid(10), type: metadata.subscription_type, data });
				}
			}
		})

		let badges;
		let globalBadges = await this.reqClient.get(ENDPOINTS.GET_BADGES(), {
			headers: {
				Authorization: `Bearer ${this.appToken}`,
			},
		});
		globalBadges = globalBadges.data.data;

		let channelBadges = await this.reqClient.get(ENDPOINTS.GET_CHANNEL_BADGES(), {
			headers: {
				Authorization: `Bearer ${this.appToken}`,
			},
		});
		channelBadges = channelBadges.data.data;
		badges = [...channelBadges, ...globalBadges];

		this.badges = new Map();
		for(let b of badges) {
			if(b.set_id == 'subscriber' && this.badges.get('subscriber')) continue;
			let mp = new Map();
			for(let s of b.versions) {
				mp.set(s.id, s);
			}
			this.badges.set(b.set_id, mp);
		}

		let prns = await axios.get(`https://api.pronouns.alejo.io/v1/pronouns`);
		prns = prns.data;
		for(var p in prns) {
			this.pronouns.set(p, prns[p]);
		}
	}

	async getAppToken() {
		var query =
			`client_id=${process.env.CLIENT_ID}` +
			`&client_secret=${process.env.CLIENT_SECRET}` +
			`&grant_type=client_credentials`;
		try {
			var req = await axios.post(`https://id.twitch.tv/oauth2/token?${query}`);
			var data = req.data;
		} catch (e) {
			console.log(e.config, e.message);
		}

		return data.access_token;
	}

	async getUserToken() {
		let tokens = this.db.prepare('select * from users').get();
		console.log(tokens);

		let req;
		try {
			req = await axios.get('https://id.twitch.tv/oauth2/validate', {
				headers: {
					'Authorization': `OAuth ${tokens.access}`
				}
			})
		} catch(e) {
			if(e.response) console.error(e.response.status, e.response.data);
		}

		if(req?.status == 200) return tokens.access;
		console.log('invalid auth, trying refresh');
		const params = new URLSearchParams({
			client_id: process.env.CLIENT_ID,
			client_secret: process.env.CLIENT_SECRET,
			grant_type: 'refresh_token',
			refresh_token: tokens.refresh
		})
		try {
			req = await axios.post('https://id.twitch.tv/oauth2/token', params);
		} catch(e) {
			console.log(e);
			if(e.response) console.error(e.response.status, e.response.data);
		}

		console.log(req?.data);
		if(!req?.data?.access_token) return null;

		this.db.prepare('update users set access=:access, refresh=:refresh').run({
			access: req.data.access_token,
			refresh: req.data.refresh_token
		});

		return req.data.access_token;
	}

	async setSubs(sesh) {
		for(let s of Subscriptions) {
			SUBS.set(s.data.type, s);
			try {
				const subreq = await this.reqClient.post(ENDPOINTS.CREATE_SUBSCRIPTION(), {
					...s.data,
			    "transport": {
			        "method": "websocket",
			        "session_id": sesh
			    }
				}, {
					headers: {
						'Authorization': `Bearer ${this.userToken}`
					}
				})
			} catch(e) {
				if(e.response) {
					console.log(s.data.type, e.response.status, e.response.data);
				}
			}
				
		}
	}

	async handleQueue() {
		if(!this.queue.length) return;

		let item = this.queue.shift();
		this.emit('event', item);
	}

	addClient(id, res) {
		this.evtClients[id] = res;
		res.socket.on("end", (_) => {
			delete this.evtClients[id];
			res.end();
		});

		res.setHeader("Content-Type", "text/event-stream");
		res.write(`event: connect\n`);
		res.write(`data: Connection established.\n\n`);
	}

	sendData(evt, data) {
		for (var c of Object.values(this.evtClients)) {
			c.write(`event: ${evt}\n`);
			c.write(`data: ${JSON.stringify(data)}\n\n`);
		}
	}

	async handleEvent({ id, type, data }) {
		let subtype = await SUBS.get(type);
		if(!subtype) return;
		let result = await subtype.execute(data.event);

		this.sendData('special', {
			text: result,
			sound: subtype.sound,
			img: subtype.img
		})
	}

	async handleChat({ id, data: { event } }) {
		let { message: { fragments: frags }, badges, color, chatter_user_name: username } = event;
		// console.log(badges, this.badges.get('subscriber'));
		// return;

		let type, msg, prns;
		let preq;
		try {
			preq = await axios.get(`https://api.pronouns.alejo.io/v1/users/${username}`);
			preq = preq.data;

			let tmp = '';
			let ptmp;
			if(preq?.pronoun_id) {
				ptmp = this.pronouns.get(preq.pronoun_id);
				tmp += `${ptmp.subject}/`;
			}

			if(preq?.alt_pronoun_id) {
				let ptmp2 = this.pronouns.get(preq.alt_pronoun_id);
				tmp += ptmp2.subject;
			} else tmp += ptmp.object;

			prns = tmp;
		} catch(e) { }

		let sys = await getSystem(username);
		if(sys) {
			let prox = getProxiedMessage(sys, frags);
			if(prox) {
				frags = prox.cleanFragments;
				color = (prox.member.color ?? prox.system.color ?? color);
				username = `${prox.member.name} (${username})`;
				prns = prox.member.pronouns;
			}
		}

		frags = frags.filter(x => x.text?.length);
		if(frags?.length == 1 && frags[0].type == 'emote') {
			// emote-only chats appear as emotes flying across the screen
			type = 'emote';
			msg = {
				id,
				src: EMOTES.replace(':id', frags[0].emote.id)
			}
		} else {
			// actual chats appear as... actual chats lol
			let tml = '';
			let bml = '';
			let uml = '';

			for(var f of frags) {
				if(f.type == 'text') tml += f.text;
				else tml += `<img src="${EMOTES.replace(':id', f.emote.id)}" class="emoji"/>`;
			}

			if(badges?.length) {
				for(let b of badges) {
					let set = this.badges.get(b.set_id);
					if(!set) continue;
					let bdg = set.get(b.id)
					if(!bdg) continue;
					bml += `<img src="${bdg.image_url_1x}" class="badge" />`;
				}
			}

			if(prns?.length) {
				uml = `<span class="pronouns">${prns}</span><span style="color: ${color}"><strong>${username}</strong></span>`;
			} else uml = `<span style="color: ${color}"><strong>${username}</strong></span>`;

			type = 'message';
			msg = {
				id,
				textML: tml,
				badgeML: bml,
				userML: uml
			}
		}

		this.sendData(type, msg);
	}
}