export default {
	data: {
		type: 'channel.chat.message',
		version: 1,
		condition: {
			broadcaster_user_id: process.env.USER_ID,
			user_id: process.env.USER_ID
		}
	},
}