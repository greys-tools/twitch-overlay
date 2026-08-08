export const HEADERS = {
	ID: 'twitch-eventsub-message-id',
	TIMESTAMP: 'twitch-eventsub-message-timestamp',
	TYPE: 'twitch-eventsub-message-type',
	SIGNATURE: 'twitch-eventsub-message-signature'
}

export const EVENTS = {
	CHALLENGE: 'webhook_callback_verification',
	NOTIFICATION: 'notification',
	REVOKE: 'revocation'
}

export const ENDPOINTS = {
	BASE: () => `https://api.twitch.tv/helix`,
	// BASE: () => `http://127.0.0.1:8080`,
	GET_SUBSCRIPTIONS: () => `/eventsub/subscriptions`,
	CREATE_SUBSCRIPTION: () => `/eventsub/subscriptions`,
	DELETE_SUBSCRIPTION: (id) => `/eventsub/subscriptions?id=${id}`,
	GET_BADGES: () => `/chat/badges/global`,
	GET_CHANNEL_BADGES: () => `/chat/badges?broadcaster_id=${process.env.USER_ID}`
}

export const EMOTES = `https://static-cdn.jtvnw.net/emoticons/v2/:id/default/light/2.0`;
export const SOCKET = `wss://eventsub.wss.twitch.tv/ws`;
// export const SOCKET = `ws://127.0.0.1:8080/ws`;