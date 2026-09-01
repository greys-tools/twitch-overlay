import PClient from '../handlers/vts.js';

export default class BaldRedeem {
	client;

	title = 'BALD!';

	interval;
	endTime;
	hotkey;

	constructor(client) {
		this.client = client;
	}

	async execute({ username }) {
		if(!this.hotkey) {
			let hk = await PClient.hotkeys.getHotkeys();
			let bhk = Array.from(hk).map(([_,v]) => v).find((x) => x.name == 'bald');
			this.hotkey = bhk;
		}
		
		if(!this.interval) {
			this.endTime = Date.now() + 15_000; // 15 seconds
			this.interval = setInterval(async () => {
				if(Date.now() > this.endTime) {
					await this.hotkey.execute();
					clearInterval(this.interval)
				}
			}, 1_000);
			await this.hotkey.execute();
			return `@${username} bald time :)`;
		} else {
			this.endTime += 15_000; // add 15 more seconds
			return `@${username} bald toggle is now on for ${Math.floor((this.endTime - Date.now()) / 1000)} seconds!`
		}
	}
}