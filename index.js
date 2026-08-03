import 'dotenv/config';
import express from "express";
import fs from "node:fs";
import Client from './handlers/client.js';

const client = new Client();
await client.init();

const app = express();
app.use(express.json());
app.use(express.static(__dirname + "/assets"));

const index = fs.readFileSync("./pages/index.html");
app.get("/", async (req, res) => {
	return res.status(200).send(index.toString("utf-8"));
});

const chat = fs.readFileSync("./pages/chat-only.html");
app.get("/chat-only", async (req, res) => {
	return res.status(200).send(chat.toString("utf-8"));
});

const alerts = fs.readFileSync("./pages/alerts-only.html");
app.get("/alerts-only", async (req, res) => {
	return res.status(200).send(alerts.toString("utf-8"));
});

app.get("/events", async (req, res) => {
	console.log("New connection request received");
	let clientId = req.query.client_id;

	client.addClient(clientId, res);
});


const PORT = process.env.PORT ?? 8080;
app.listen(PORT);
console.log(`App listening on port ${PORT}`);
