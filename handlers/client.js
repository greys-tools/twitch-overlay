import { EventEmitter } from 'node:events';
import axios from 'axios';
import { nanoid } from 'nanoid';
import { SOCKET, ENDPOINTS, EMOTES } from '../constants.js';
import Subscriptions from '../subscriptions/index.js';
import db from './data.js';
// handles connections to twitch

export default class Client extends EventEmitter {
	reqClient = axios.create({
		baseURL: ENDPOINTS.BASE(),
		headers: {
			"Client-Id": process.env.CLIENT_ID,
		},
	})

	SUBS = new Map();

	db = db;
	ws;
	reconnect;
	connected = false;
	refreshInterval;

	appToken;
	userToken;
	botToken;

	constructor() {
		super();

		this.on('connected', ({ session_id }) => this.setSubs(session_id));
		this.on('close', () => this.startSocket());

		// refresh tokens every 60m just to be safe
		// twitch recommends hourly refresh/validation like this
		this.refreshInterval = setInterval(async () => {
			this.userToken = await this.getUserToken(process.env.USER_ID);
			this.botToken = await this.getUserToken(process.env.BOT_ID);
			this.appToken = await this.getAppToken();
			this.emit('tokenUpdate', {
				userToken: this.userToken,
				botToken: this.botToken,
				appToken: this.appToken
			});
		}, 60 * 60 * 1_000);
	}

	async init() {
		this.appToken = await this.getAppToken();
		this.userToken = await this.getUserToken(process.env.USER_ID);
		this.botToken = await this.getUserToken(process.env.BOT_ID);
		await this.startSocket();
	}

	async startSocket() {
		let url = SOCKET;
		if(this.reconnect) url = this.reconnect;
		let sck = new WebSocket(url);
		sck.addEventListener('message', async (msg) => {
			let { metadata, payload: data } = JSON.parse(msg.data);
			console.log(data);
			switch(metadata?.message_type) {
				case 'session_welcome':
					this.connected = true;
					this.emit('connected', { session_id: data.session.id })
					break;
				case 'reconnect':
					this.reconnect = data.session.reconnect_url;
					await this.startSocket();
					break;
				case 'notification':
					if(metadata.subscription_type == 'channel.chat.message') {
						this.emit('chat', { id: nanoid(10), data });
					} else if(metadata.subscription_type == 'channel.channel_points_custom_reward_redemption.add') {
						this.emit('redeem', { id: nanoid(10), data });
					} else this.emit('event', { id: nanoid(10), type: metadata.subscription_type, data });
					break;
				default:
					break;
			}
		})

		sck.addEventListener('close', (data) => this.emit('close', data));

		this.ws = sck;
		return sck;
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

	async getUserToken(id) {
		let tokens = this.db.getToken(id);
		console.log(tokens);

		let req;
		if(!tokens) this.db.createToken(id);
		else {
			try {
				req = await axios.get('https://id.twitch.tv/oauth2/validate', {
					headers: {
						'Authorization': `OAuth ${tokens.access}`
					}
				})
			} catch(e) {
				if(e.response) console.error(e.response.status, e.response.data);
			}
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

		this.db.updateToken({
			access: req.data.access_token,
			refresh: req.data.refresh_token,
			id
		});

		return req.data.access_token;
	}

	async setSubs(sesh) {
		if(this.reconnect) return; // subscriptions should continue on reconnection
		for(let s of Subscriptions) {
			this.SUBS.set(s.data.type, s);
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
}