import { splitToSpans as split } from '../utils.js';

export default {
	data: {
		type: 'channel.bits.use',
		version: 1,
		condition: {
			broadcaster_user_id: process.env.USER_ID
		}
	},
	sound: 'CHEER',
	img: 'CHEER',
	async alert(ctx) {
		return (
			`<span class="animated">` +
			split(ctx.user_name) +
			`</span>` +
			` used <br>` +
			`<strong><span class="animated">` +
			split((ctx.bits).toString()) +
			`</span> bits</strong>!`
		)
	}
}