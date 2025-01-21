const axios = require("axios");
const crypto = require("crypto");
const fs = require("fs");
const { ENDPOINTS, HEADERS, EVENTS } = require("../constants");
const { sleep } = require("../utils");;

const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const callbackURL = process.env.CALLBACK_URL;
const appSecret = process.env.APP_SECRET;

const SUBS = new Map();

var running;

const Client = axios.create({
	baseURL: ENDPOINTS.BASE(),
	headers: {
		"Client-Id": clientID,
		"Content-Type": "application/json",
	},
});

function verify(req, res, next) {
	if(process.env.DEV) return next();
	if (!verifyHash(req.headers, req.body)) return res.status(403).send();
	next();
}

function verifyHash(headers, body) {
	var data =
		headers[HEADERS.ID] + headers[HEADERS.TIMESTAMP] + JSON.stringify(body);
	var sig = headers[HEADERS.SIGNATURE];

	var hash = crypto.createHmac("sha256", appSecret).update(data).digest("hex");
	hash = `sha256=` + hash;

	return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(sig));
}

const recursiveRead = (dir) => {
	var results = [];
	var files = fs.readdirSync(dir, {withFileTypes: true});
	for(file of files) {
		if(file.isDirectory()) {
			results = results.concat(recursiveRead(dir+"/"+file.name));
		} else {
			results.push(dir+"/"+file.name);
		}
	}

	return results;
}

async function handleQueue(clients) {
	running = true;

	if (events.length) {
		let subtype = await SUBS.get(events[0].type);
		let result = await subtype.execute(events[0].data);

		for (var c of Object.values(clients)) {
			c.write(`event: special\n`);
			c.write(`data: ${JSON.stringify({
				text: result,
				sound: subtype.sound,
				img: subtype.img
			})}\n\n`);
		}
		events.shift();
		await sleep(3000);
	}

	if (!events.length) running = false;
	else await handleQueue(clients);
}

async function clean() {
	var l = processed.size;
	for (var [k, v] of processed) {
		var cur = new Date();
		var dt = new Date(v);
		if (dt < cur - 2 * 60 * 1000) processed.delete(k);
	}
	console.log(`cleaned ${l - processed.size} processed notifications`);
}

const events = [];
const processed = new Map();

module.exports = async function setup(app, evtClients, TOKEN) {
	const files = recursiveRead(__dirname + '/../subscriptions');
	for(var f of files) {
		var sub = require(f);
		SUBS.set(sub.data.type, sub);
	}

	console.log(SUBS);

	try {
		if(!process.env.DEV) {
			Client.defaults.headers["Authorization"] = `Bearer ${TOKEN}`;

			var transport = {
				method: "webhook",
				callback: callbackURL,
				secret: appSecret,
			};

			var req = await Client.get(ENDPOINTS.GET_SUBSCRIPTIONS());
			var existing = req.data;

			for (var e of existing.data) {
				if (e.status == "enabled" && e.transport.callback == callbackURL)
					continue;
				await Client.delete(ENDPOINTS.DELETE_SUBSCRIPTION(e.id));
			}

			for (var sub of Array.from(SUBS, (k,v) => v)) {
				if (
					!existing.data.find(
						(s) =>
							s.type == sub.data.type &&
							s.status == "enabled" &&
							s.transport.callback == callbackURL,
					)
				) {
					await Client.post(ENDPOINTS.CREATE_SUBSCRIPTION(), {
						...sub.data,
						transport,
					});
				}
			}
		}

		app.post("/", verify, (req, res) => {
			res.set("content-type", "text/plain");
			if (processed.has(req.headers[HEADERS.ID])) return res.status(200).send();
			processed.set(req.headers[HEADERS.ID], req.headers[HEADERS.TIMESTAMP]);

			var type = req.headers[HEADERS.TYPE];
			switch (type) {
				case EVENTS.NOTIFICATION:
					events.push({
						id: req.headers[HEADERS.ID],
						type: req.body.subscription.type,
						data: req.body.event,
					});
					if (!running) handleQueue(evtClients);
					break;
				case EVENTS.CHALLENGE:
					return res.status(200).send(req.body.challenge);
					break;
				case EVENTS.REVOKE:
					break;
			}

			return res.status(204).send();
		});

		setInterval(() => clean(), 2 * 60 * 1000);
	} catch (e) {
		console.log(e.message, e.response?.data);
	}
};
