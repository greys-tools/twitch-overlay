const { splitToSpans: split } = require('../utils');

module.exports = {
	data: {
		type: 'channel.cheer',
		version: 1,
		condition: {
			broadcaster_user_id: process.env.USER_ID
		}
	},
	sound: 'CHEER',
	img: 'CHEER',
	async execute(ctx) {
		return (
			`<span class="animated">` +
			split(ctx.user_name) +
			`</span>` +
			` cheered for <br>` +
			`<strong><span class="animated">` +
			split((ctx.bits).toString()) +
			`</span> bits</strong>!`
		)
	}
}