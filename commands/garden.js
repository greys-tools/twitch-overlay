export default class GardenCommand {
	client;
	daily = new Set();

	name = 'garden';
	description = "Tend to your garden 🌱";

	constructor(client) {
		this.client = client;
	}

	async execute({ username, userid }) {
		let data = await this.client.db.getGarden(userid);
		console.log(data);
		if(!data) {
			await this.client.db.createGarden(userid);
			data = { user_id: userid, amount: 0 };
		}

		if(this.daily.has(userid)) {
			return `@${username} You have ${data.amount} Pikmin! 🌱`;
		} else {
			this.daily.add(userid);
			let amt = getAmt();
			await this.client.db.updateGarden({ id: userid, amount: data.amount + amt });
			return (
				`@${username} You tend your garden and find ${amt} more Pikmin have grown! ` +
				`You now have ${data.amount + amt} Pikmin 🌱`
			);
		}
	}
}

function getAmt() {
	return Math.floor(Math.random() * 10) + 1;
}