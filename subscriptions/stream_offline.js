export default {
	data: {
		type: 'stream.offline',
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
						content: `## Stream Offline!\nWe're done streaming for now. Thanks for hanging out!`
					},
					{
						type: 12,
						items: [{
							media: {
								url: 'https://cdn.selenated.com/img/d230.png',
								description: 'Offline banner'
							}
						}]
					}
				]
			}
		]
	}
}