import PluginClient from 'vts-js';
import db from './data.js';

// get plugin token from db if available
let token = (db.getToken('vts'))?.access;
console.log(token);

const client = new PluginClient({ debug: true, token });
client.on('ready', async () => {
	// store token for later use
	if(!token) await db.createToken('vts');
	await db.updateToken({ id: 'vts', access: client.token })
})

await client.awaitReady();

export default client;