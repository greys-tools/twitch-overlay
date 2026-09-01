import 'dotenv/config';
import express from "express";
import fs from "node:fs";
import Client from './handlers/client.js';
import AlertsHandler from './handlers/alerts.js';
import HooksHandler from './handlers/hooks.js';
import CommandsHandler from './handlers/commands.js';
import RedeemsHandler from './handlers/redeems.js';

const client = new Client();
await client.init();

let handlers = {
	alerts: new AlertsHandler(client),
	hooks: new HooksHandler(client),
	commands: new CommandsHandler(client),
	redeems: new RedeemsHandler(client),
};
await handlers.alerts.init();
await handlers.hooks.init();
await handlers.commands.init();
await handlers.redeems.init();
client.handlers = handlers;

const app = express();
app.use(express.json());
app.use(express.static(import.meta.dirname + "/assets"));

// combined chat and alerts in one overlay
const index = fs.readFileSync("./pages/index.html");
app.get("/", async (req, res) => {
	return res.status(200).send(index.toString("utf-8"));
});

// just the chatbox, no alerts (easier to move around in scenes)
const chat = fs.readFileSync("./pages/chat-only.html");
app.get("/chat-only", async (req, res) => {
	return res.status(200).send(chat.toString("utf-8"));
});

// non-clearing chat (eg. for just chatting scenes)
const noClear = fs.readFileSync("./pages/no-clear.html");
app.get("/no-clear", async (req, res) => {
	return res.status(200).send(noClear.toString("utf-8"));
});

// just alerts, no chat
const alerts = fs.readFileSync("./pages/alerts-only.html");
app.get("/alerts-only", async (req, res) => {
	return res.status(200).send(alerts.toString("utf-8"));
});

app.get("/events", async (req, res) => {
	console.log("New connection request received");
	let clientId = req.query.client_id;

	client.handlers.alerts.addClient(clientId, res);
});

const PORT = process.env.PORT ?? 8080;
app.listen(PORT);
console.log(`App listening on port ${PORT}`);
