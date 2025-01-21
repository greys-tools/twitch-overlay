const { splitToSpans: split } = require('../utils');

module.exports = {
	data: {
		type: 'channel.subscribe',
		version: 2,
		condition: {
			broadcaster_user_id: process.env.USER_ID
		}
	},
	sound: 'SUB',
	img: 'SUB',
	async execute(ctx) {
		return (
			`<span class="animated">` +
			split(ctx.user_name) +
			`</span>` +
			` subbed at <br>tier ` +
			`<strong><span class="animated">` +
			split((ctx.tier / 1000).toString()) +
			`</span></strong>!`
		)
	}
}