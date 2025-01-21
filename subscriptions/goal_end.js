const { splitToSpans: split } = require('../utils');

module.exports = {
	data: {
		type: 'channel.goal.end',
		version: 1,
		condition: {
			broadcaster_user_id: process.env.USER_ID
		}
	},
	sound: 'GOAL_END',
	img: 'GOAL_END',
	async execute(ctx) {
		return (
			`<span class="animated">` +
			split(ctx.type) +
			`</span>` +
			`goal <strong>completed!</strong>`
		)
	}
}