# Twitch Alerts
Extremely simple self-hosted browser source for Twitch alerts and miscellaneous overlays

# Currently handled
## Alerts
The following alert types are handled:
- Follows
- Raids
- Hosts

Multiple events in a row are queued up, so no need to worry about missing one if another happens immediately after! Also, they should be on the screen for about 5 seconds

## Emotes
Emotes pop up in a random spot on the screen and shoot off to another spot while fading away. Currently only one emoji per user can be seen on the screen at a time; once that emoji has disappeared, another can be shown by the same user again. Emojis from different users shouldn't be hindered at all

**More TBA**, we're planning on changing up emotes to have a configurable per-user limit as well as adding events for subscriptions, cheers, and goals

# Self Hosting
## Requirements
- NodeJS 14.x or higher
- An account for chat access (your broadcaster account works, though you can also make an alt)
- A Twitch [dev app](https://dev.twitch.com)

## Environment
The current `example.env` looks like this:
```bash
CLIENT_ID=abcdefgh
CLIENT_SECRET=hijklmnop
APP_SECRET=randomstuffyay # secret for eventsubs

USER_ID=broadcaster_id # your broadcaster id
BOT_USERNAME=yourname # your bot's name (or yours, no bot acc needed)
CHANNEL_NAME=yourname # your broadcaster username/login
OAUTH_TOKEN=oauth:yourtoken # from the bot_username acc. get from twitchapps.com/tmi

CALLBACK=https://example.com # your domain 
PORT=8080 # server port
WS_PORT=3000 # websocket port

NGINX=0 # using nginx? change this to 1
```

- Client ID and secret are from your dev app
- App secret should be *randomly genderated* to be secure  

This app uses socket.io for communicating between the frontend and backend, which NginX has some issues with. If you're using NginX on your host, try using [these docs](https://socket.io/docs/v4/reverse-proxy/) to configure it for use with socket.io. Unfortunately, **we can't provide support for that aspect.** If it works in development, but not in production, chances are it's an issue with NginX and we're not entirely sure how we managed to fix our problem to start with 😔

## Steps
1. Clone this repo to your host
2. Copy the `example.env`, rename to `.env`, and supply the correct info
3. Run `npm install` to install dependencies
4. Run `node index` to get it up and running
5. Replace the sounds and images in `/assets` (keep the names the same! or just make sure to change them in `index.html`)
6. Configure anything else you need to make the site available on the web (eg. DNS, NginX, etc)
7. Add the site as a browser source in whatever streaming application you use, making sure it covers the full screen

If you have an alt account, you can test that it's working by following your main and making sure that an alert pops up\*. If all's working, then you're all set! The app handles everything necessary for staying subscribed to events, so you can just leave it running for whenever you stream

\* = **NOTE:** Sometimes sounds won't play at first if you're looking at it in an actual browser- you have to "interact" with the page first (try clicking in the blank space). This isn't a problem for browser sources, thankfully

## Support
If you need support, feel free to open an issue! However, please note that we *can not* provide support related to socket.io or NginX issues- we can only help if something directly related to the program breaks

If you'd like to support *us*, we've got a [Patreon](https://patreon.com/greysdawn) and a [Ko-Fi](https://ko-fi.com/greysdawn) you can chuck some money at, if you're interested. No pressure though 💜