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
		BASE: () => `https://api.twitch.tv/helix`,
		GET_SUBSCRIPTIONS: () => `/eventsub/subscriptions`,
		CREATE_SUBSCRIPTION: () => `/eventsub/subscriptions`,
		DELETE_SUBSCRIPTION: (id) => `/eventsub/subscriptions?id=${id}`,
		GET_BADGES: () => `chat/badges/global`
	}
}