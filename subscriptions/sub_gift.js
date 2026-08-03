import { splitToSpans as split } from '../utils.js';

export default {
	data: {
		type: 'channel.subscription.gift',
		version: 1,
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