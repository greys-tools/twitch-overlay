import { getSystem, getProxiedMessage } from 'pluralmind';
import { ENDPOINTS, EMOTES } from '../constants.js';
import axios from 'axios';

// handles all of the code for making chat & alerts appear
export default class AlertsHandler {
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
		this.client.on('chat', (data) => this.handleChat(data));

		this.interval = setInterval(() => this.handleQueue(), 3_000);
	}

	async init() {
		let badges;
		let globalBadges = await this.client.reqClient.get(ENDPOINTS.GET_BADGES(), {
			headers: {
				Authorization: `Bearer ${this.client.appToken}`,
			},
		});
		globalBadges = globalBadges.data.data;

		let channelBadges = await this.client.reqClient.get(ENDPOINTS.GET_CHANNEL_BADGES(), {
			headers: {
				Authorization: `Bearer ${this.client.appToken}`,
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

	async handleQueue() {
		if(!this.queue.length) return;

		let item = this.queue.shift();
		console.log(item);
		await this.handleEvent(item);
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
		let subtype = await this.client.SUBS.get(type);
		if(!subtype || !subtype?.alert) return;
		let result = await subtype.alert(data.event);

		this.sendData('special', {
			text: result,
			sound: subtype.sound,
			img: subtype.img
		})
	}

	async handleChat({ id, data: { event } }) {
		let { message: { fragments: frags }, message_type: mtype, badges, color, chatter_user_name: username } = event;
		if(mtype !== "text") return;

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
				switch(f.type) {
					case 'text':
						tml += f.text
						break;
					case 'emote':
						tml += `<img src="${EMOTES.replace(':id', f.emote.id)}" class="emoji"/>`
						break;
					case 'mention':
						tml = f.mention.user_name;
						break;
					case 'gif':
					case 'cheermote':
						return;
				}
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