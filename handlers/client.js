import { EventEmitter } from 'node:events';
import axios from 'axios';
import { nanoid } from 'nanoid';
import { SOCKET, ENDPOINTS, EMOTES } from '../constants.js';
import Subscriptions from '../subscriptions/index.js';
import { DatabaseSync } from 'node:sqlite';

// handles connections to twitch

export default class Client extends EventEmitter {
	reqClient = axios.create({
		baseURL: ENDPOINTS.BASE(),
		headers: {
			"Client-Id": process.env.CLIENT_ID,
		},
	})

	SUBS = new Map();

	db = new DatabaseSync(`${import.meta.dirname}/../db.sqlite`);
	ws;
	reconnect;
	connected = false;
	refreshInterval;

	appToken;
	userToken;

	constructor() {
		super();

		this.on('connected', ({ session_id }) => this.setSubs(session_id));
		this.on('close', () => this.startSocket());

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
		await this.startSocket();
	}

	async startSocket() {
		let url = SOCKET;
		if(this.reconnect) url = this.reconnect;
		let sck = new WebSocket(SOCKET);
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