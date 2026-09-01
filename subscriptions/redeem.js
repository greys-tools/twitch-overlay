export default {
	data: {
		type: 'channel.channel_points_custom_reward_redemption.add',
		version: 1,
		condition: {
			broadcaster_user_id: process.env.USER_ID
		}
	},
}