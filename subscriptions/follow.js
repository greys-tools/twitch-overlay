const { splitToSpans: split } = require('../utils');

module.exports = {
	data: {
		type: 'channel.follow',
		version: 2,
		condition: {
			broadcaster_user_id: process.env.USER_ID,
			moderator_user_id: process.env.USER_ID
		}
	},
	sound: 'FOLLOW',
	img: 'FOLLOW',
	async execute(ctx) {
		return (
			`<span class="animated">` +
			split(ctx.user_name) +
			`</span>` +
			` just followed!`
		)
	}
}