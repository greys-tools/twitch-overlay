import { splitToSpans as split } from '../utils.js';

export default {
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
	async alert(ctx) {
		return (
			`<span class="animated">` +
			split(ctx.user_name) +
			`</span>` +
			` just followed!`
		)
	},
	async hook(ctx) {
		return [{
			type: 17,
			accent_color: 0x5555aa,
			components: [{
				type: 10,
				content: `## New follower!\n**[${ctx.user_name}](<https://twitch.tv/${ctx.user_name}>)** just followed!`
			}]
		}]
	}
}