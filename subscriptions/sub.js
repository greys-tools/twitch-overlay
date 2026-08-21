import { splitToSpans as split } from '../utils.js';

export default {
	data: {
		type: 'channel.subscribe',
		version: 1,
		condition: {
			broadcaster_user_id: process.env.USER_ID
		}
	},
	sound: 'SUB',
	img: 'SUB',
	async alert(ctx) {
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