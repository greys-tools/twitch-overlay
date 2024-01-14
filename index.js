require('dotenv').config();

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const express = require('express');
const app = new express();
app.use(express.json());

const { Server } = require('socket.io');
const io = new Server(app.listen(process.env.PORT || 8080), {
	cors: { origin: '*' }
});
const appNsp = io.of('/notifs');

io.on('connection', socket => {
	socket.send("test");
})

appNsp.on('connection', socket => {
	var user_limit = process.env.USER_EMOTE_LIMIT;
	if(typeof user_limit == 'string') user_limit = parseInt(user_limit);
	if(isNaN(user_limit)) user_limit = 5;
	appNsp.emit('vars', {
		user_limit
	})
})

const tmi = require('tmi.js');
const client = new tmi.Client({
	identity: {
		username: process.env.BOT_USERNAME,
		password: process.env.OAUTH_TOKEN
	},
	channels: [process.env.CHANNEL_NAME]
})

const {
	EVENTS,
	HEADERS,
	ENDPOINTS
} = require('./constants');

const SUBS = [
	{
		type: 'channel.follow',
		version: 2,
		condition: {
			broadcaster_user_id: process.env.USER_ID,
			moderator_user_id: process.env.USER_ID
		}
	},
	{
		type: 'channel.raid',
		version: 1,
		condition: {
			to_broadcaster_user_id: process.env.USER_ID
		}
	},
	{
		type: 'channel.subscribe',
		version: 1,
		condition: {
			broadcaster_user_id: process.env.USER_ID
		}
	},
	{
		type: 'channel.subscription.gift',
		version: 1,
		condition: {
			broadcaster_user_id: process.env.USER_ID
		}
	},
	{
		type: 'channel.subscription.message',
		version: 1,
		condition: {
			broadcaster_user_id: process.env.USER_ID
		}
	},
	{
		type: 'channel.cheer',
		version: 1,
		condition: {
			broadcaster_user_id: process.env.USER_ID
		}
	},
	{
		type: 'channel.goal.progress',
		version: 1,
		condition: {
			broadcaster_user_id: process.env.USER_ID
		}
	},
	{
		type: 'channel.goal.end',
		version: 1,
		condition: {
			broadcaster_user_id: process.env.USER_ID
		}
	},
]

const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const appSecret = process.env.APP_SECRET;
const userID = process.env.USER_ID;
const callbackURL = process.env.CALLBACK;
const wsPort = process.env.WS_PORT || 3000;
const nginx = parseInt(process.env.NGINX);
const resolution = process.env.RESOLUTION;

let BADGES;
let TOKEN;

let index = fs.readFileSync(__dirname + '/index.html', 'utf8');
if(!nginx) index = index.replace('%WS_URL%', `${callbackURL}:${process.env.PORT}`);
else index = index.replace('%WS_URL%', callbackURL);

var processed = new Map();
var queue = [];
var running = false;

function cleanProcessed() {
	var l = processed.size;
	for(var [k, v] of processed) {
		var cur = new Date();
		var dt = new Date(v);
		if(dt < (cur - (2*60*1000))) processed.delete(k);
	}
	console.log(`cleaned ${l - processed.size} processed notifications`);
}

function verify (req, res, next) {
	if(!verifyHash(req.headers, req.body)) return res.status(403).send();
	next();
}

app.get('/', (req, res) => {	
	return res.send(index);
})

app.post('/', verify, (req, res) => {
	res.set('content-type', 'text/plain');
	if(processed.has(req.headers[HEADERS.ID])) return res.status(200).send();
	processed.set(req.headers[HEADERS.ID], req.headers[HEADERS.TIMESTAMP]);

	var type = req.headers[HEADERS.TYPE];
	switch(type) {
		case EVENTS.NOTIFICATION:
			queue.push({
				id: req.headers[HEADERS.ID],
				type: req.body.subscription.type,
				event: req.body.event
			})
			if(!running) handleQueue();
			break;
		case EVENTS.CHALLENGE:
			return res.status(200).send(req.body.challenge);
			break;
		case EVENTS.REVOKE:
			break;
	}

	return res.status(204).send();
})

function verifyHash(headers, body) {
	var data = headers[HEADERS.ID] +
			   headers[HEADERS.TIMESTAMP] +
			   JSON.stringify(body);
	var sig = headers[HEADERS.SIGNATURE];

	var hash = crypto.createHmac('sha256', appSecret)
		.update(data)
		.digest('hex');
	hash = `sha256=`+hash;

	return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(sig));
}

async function handleQueue() {
	running = true;

	if(queue.length) {
		appNsp.emit('message', queue[0]);
		queue.shift();
		await sleep(5000);
	}

	if(!queue.length) running = false;
	else await handleQueue();
}

async function sleep(ms) {
	return new Promise((res, rej) => {
		setTimeout(() => res(), ms);
	})
}

async function getToken() {
	var query =
		`client_id=${clientID}` +
		`&client_secret=${clientSecret}` +
		`&grant_type=client_credentials`;
	try {
		var req = await axios.post(`https://id.twitch.tv/oauth2/token?${query}`);
		var data = req.data;
	} catch(e) {
		console.log(e.config, e.message);
	}
	
	return data.access_token;
}

const SUB_INST = axios.create({
	baseURL: ENDPOINTS.BASE(),
	headers: {
		'Client-Id': clientID,
		'Content-Type': 'application/json'
	}
})
async function setup() {
	try {
		TOKEN = await getToken();
		SUB_INST.defaults.headers['Authorization'] = `Bearer ${TOKEN}`;

		var transport = {
			method: 'webhook',
			callback: callbackURL,
			secret: appSecret
		}

		var req = await SUB_INST.get(ENDPOINTS.GET_SUBSCRIPTIONS());
		var existing = req.data;

		for(var e of existing.data) {
			if(e.status == 'enabled') continue;
			await SUB_INST.delete(ENDPOINTS.DELETE_SUBSCRIPTION(e.id));
		}

		for(var sub of SUBS) {
			if(!existing.data.find(s => s.type == sub.type && s.status == "enabled")) {
				await SUB_INST.post(ENDPOINTS.CREATE_SUBSCRIPTION(), {
					...sub,
					transport
				})
			}
		}

		req = await SUB_INST(ENDPOINTS.GET_BADGES());
		BADGES = req.data.data;
		index = index.replace('%BADGES', JSON.stringify(BADGES));
	} catch(e){
		console.log(e.message, e.response?.data)
	}
}

client.connect();
client.on('message', (channel, state, message, self) => {
	if(self) return;

	// console.log(message, state);
	if(!state['emote-only'] && state['message-type'] == 'chat') {
		appNsp.emit('message', {
			id: state.id,
			type: state['message-type'],
			event: {
				message,
				user: state.username,
				state
			}
		})
	} else if(state['emote-only']) {
		appNsp.emit('message', {
			id: state.id,
			type: 'emote',
			event: {
				emote: Object.keys(state.emotes)[0],
				user: state.username
			}
		})
	}
});
client.on('hosted', (channel, username, viewers, autohost) => {
	queue.push({
		id: 'hosting',
		type: 'host',
		event: {
			username,
			viewers
		}
	})

	if(!running) handleQueue();
})

setInterval(() => cleanProcessed(), 2 * 60 * 1000);
setup();
app.use(express.static(__dirname + '/assets'));