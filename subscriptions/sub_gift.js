const { splitToSpans: split } = require('../utils');

module.exports = {
	data: {
		type: 'channel.subscription.gift',
		version: 2,
		condition: {
			broadcaster_user_id: process.env.USER_ID
		}
	},
	sound: 'SUB_GIFT',
	img: 'SUB_GIFT',
	async execute(ctx) {
		return (
			`<span class="animated">` +
			split(ctx.user_name ?? "Anonymous") +
			`</span>` +
			` gifted <br>` +
			`<strong><span class="animated">` +
			split((ctx.total).toString()) +
			`</span> subs</strong>!`
		)
	}
}