import { splitToSpans as split } from '../utils.js';

export default {
	data: {
		type: 'channel.raid',
		version: 1,
		condition: {
			to_broadcaster_user_id: process.env.USER_ID
		}
	},
	sound: 'RAID',
	img: 'RAID',
	async execute(ctx) {
		return (
			`<span class="animated">` +
			split(ctx.from_broadcaster_user_name) +
			`</span>` +
			` just raided with ` +
			`<span class="animated">` +
			split(ctx.viewers.toString()) +
			`</span>` +
			` viewers!`
		)
	}
}