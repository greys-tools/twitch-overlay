import PluginClient from 'vts-js';

const client = new PluginClient({ debug: true });
await client.awaitReady();

export default client;