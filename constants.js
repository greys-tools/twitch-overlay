module.exports = {
	HEADERS: {
		ID: 'twitch-eventsub-message-id',
		TIMESTAMP: 'twitch-eventsub-message-timestamp',
		TYPE: 'twitch-eventsub-message-type',
		SIGNATURE: 'twitch-eventsub-message-signature'
	},
	EVENTS: {
		CHALLENGE: 'webhook_callback_verification',
		NOTIFICATION: 'notification',
		REVOKE: 'revocation'
	},
	ENDPOINTS: {
		BASE: () => `https://api.twitch.tv/helix/eventsub`,
		GET_SUBSCRIPTIONS: () => `/subscriptions`,
		CREATE_SUBSCRIPTION: () => `/subscriptions`,
		DELETE_SUBSCRIPTION: (id) => `/subscriptions?id=${id}`
	}
}