import { splitToSpans as split } from '../utils.js';

export default {
	data: {
		type: 'channel.subscription.message',
		version: 1,
		condition: {
			broadcaster_user_id: process.env.USER_ID
		}
	},
	sound: 'RESUB',
	img: 'RESUB',
	async execute(ctx) {
		return (
			`<span class="animated">` +
			split(ctx.user_name) +
			`</span>` +
			` resubbed for <br>` +
			`<strong><span class="animated">` +
			split((ctx.duration_months).toString()) +
			`</span> months</strong>!`
		)
	}
}