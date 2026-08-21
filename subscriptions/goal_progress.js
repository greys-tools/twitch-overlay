import { splitToSpans as split } from '../utils.js';

export default {
	data: {
		type: 'channel.goal.progress',
		version: 1,
		condition: {
			broadcaster_user_id: process.env.USER_ID
		}
	},
	sound: 'GOAL_PROGRESS',
	img: 'GOAL_PROGRESS',
	async alert(ctx) {
		return (
			`<span class="animated">` +
			split(ctx.type) +
			`</span>` +
			` goal progress!<br>` +
			`<strong><span class="animated">` +
			split((ctx.current_amount).toString()) +
			`</span></strong> out of <strong><span class="animated">` +
			split((ctx.target_amount).toString()) +
			`</span></strong>!`
		)
	}
}