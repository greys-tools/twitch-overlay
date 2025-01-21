const { splitToSpans: split } = require('../utils');

module.exports = {
	data: {
		type: 'channel.raid',
		version: 2,
		condition: {
			to_broadcaster_user_id: process.env.USER_ID
		}
	},
	sound: 'RAID',
	img: 'RAID',
	async execute(ctx) {
		return (
			`<span class="animated">` +
			split(ctx.from_broadcaster_user_name) +
			`</span>` +
			` just raided with ` +
			`<span class="animated">` +
			split(ctx.viewers.toString()) +
			`</span>` +
			` viewers!`
		)
	}
}