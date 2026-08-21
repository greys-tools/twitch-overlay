export default {
	data: {
		type: 'stream.online',
		version: 1,
		condition: {
			broadcaster_user_id: process.env.USER_ID,
		}
	},
	async hook(ctx) {
		return [
			{
				type: 17,
				accent_color: 0xfa9451,
				components: [
					{
						type: 10,
						content: `## Stream ONLINE!\nWe're [live on Twitch](<https://twitch.tv/${process.env.CHANNEL_NAME}>), come hang out!`
					},
					{
						type: 12,
						items: [{
							media: {
								url: 'https://cdn.selenated.com/img/3bc8.png',
								description: 'Online banner'
							}
						}]
					}
				]
			},
			{
				type: 1,
				components: [{
					type: 2,
					style: 5,
					label: 'Watch now',
					url: `https://twitch.tv/${process.env.CHANNEL_NAME}`
				}]
			}
		]
	}
}