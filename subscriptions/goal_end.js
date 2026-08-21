import { splitToSpans as split } from '../utils.js';

export default {
	data: {
		type: 'channel.goal.end',
		version: 1,
		condition: {
			broadcaster_user_id: process.env.USER_ID
		}
	},
	sound: 'GOAL_END',
	img: 'GOAL_END',
	async alert(ctx) {
		return (
			`<span class="animated">` +
			split(ctx.type) +
			`</span>` +
			`goal <strong>completed!</strong>`
		)
	},
	async hook(ctx) {
		return [{
			type: 17,
			accent_color: 0x55aa55,
			components: [{
				type: 10,
				content: `## Goal completed!\n**${ctx.type}** goal was just **completed**!`
			}]
		}]
	}
}