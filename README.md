# Twitch Overlay
Extremely simple self-hosted browser source for Twitch alerts and miscellaneous overlays

# Currently handled
## Alerts
The following alert types are handled:
- Follows
- Raids
- Subscriptions
- Resubs
- Sub gifts
- Cheers
- Goal progress
- Goal end

Multiple events in a row are queued up, so no need to worry about missing one if another happens immediately after! Also, they should be on the screen for about 3 seconds by default

## Emotes
Emotes from emote-only messages pop up in a random spot on the screen and shoot off to another spot while fading away

## Chat
Against the right edge, below the alert box, is a chat window that handles (global) badges, emotes, and, of course, messages. The box is styled similarly to Twitch Studio's built-in chat overlay. Emote-only messages don't appear here, as they're handled above

## Chat-only and alerts-only options
Just want to have a chatbox, or just want alerts? You can do so! Just set your OBS browser source to your base url with `chat-only` or `alerts-only` on the end, like so: `https://example.com/chat-only`

**More TBA!**

# Customizing
## Styles
If you want to edit the styles of the overlay (ie. the page's CSS), you can find all of it near the top of the `index.html` file. You can move this to a separate file if desired, but keeping it in the `index.html` makes it so that the styles update as soon as they're edited

## Event text
Event text can be adjusted by changing the text returned in each `/subscriptions/[event].js` file. These files send HTML to the browser, so make sure that you're returning proper code there

## Adding events
Similar to editing event text, you can also add new events by adding new files to the `/subscriptions` folder! The file name doesn't matter, but it's recommended that you name it something that's easy to understand later. Keep in mind that you'll need to have some knowledge of Twitch's [EventSub API](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/) to be able to do this

## Changing sounds and images
There are two ways to change the images/sounds used:
1. Add a new file to the `/assets` folder, then go to the `index.html` and change the file name inside the `SOUNDS` or `IMAGES` object
2. Overwrite the existing sound/image with your new one, making sure the names match

Either way is perfectly acceptable. The first way will keep the original files so that you can restore them later, the second way will completely get rid of them

# Self Hosting
## VPS
### Requirements
- NodeJS 24.x or higher
- An account for chat access (your broadcaster account works, though you can also make an alt)
- A Twitch [dev app](https://dev.twitch.com)
- Twitch [tokens](https://twitchtokengenerator.com) **using your dev app's client ID and secret**
- A bit of knowledge about SQLite

### Environment
The current `example.env` looks like this:
```bash
CLIENT_ID= # your twitch dev app's ID
CLIENT_SECRET= # your twitch dev app's secret
APP_SECRET= # random string used to verify events
CALLBACK_URL= # your outside url

CHANNEL_NAME= # your channel's username
USER_ID= # your channel's user ID
BOT_USERNAME= # chat bot username, optional
OAUTH_TOKEN= # your chat bot's token, optional

PORT= # the port for your server
```

This app uses the server-sent events API for communicating between the frontend and backend. Previously we used websockets via socket.io, which NginX had issues with. This version should do better now thankfully!

### Steps
1. Clone this repo to your host
2. Copy the `example.env`, rename to `.env`, and supply the correct info
3. Run `npm install` to install dependencies
5. Grab an access token and refresh token from https://twitchtokengenerator.com, insert them into the `db.sqlite.example` where relevant (see: users table), and rename it to just `db.sqlite`
6. If you'd like, replace the sounds and images in `/assets` (keep the names the same! or just make sure to change the names in `index.html`)
7. Configure anything else you need to make the site available on the web (eg. DNS, NginX, etc)
8. Run `node index` to get it up and running
9. Add the site as a browser source in whatever streaming application you use, making sure it covers the full screen

If you have an alt account, you can test that it's working by following your main and making sure that an alert pops up\*. If all's working, then you're all set! The app handles everything necessary for staying subscribed to events, so you can just leave it running for whenever you stream

\* = **NOTE:** Sometimes sounds won't play at first if you're looking at it in an actual browser. You have to "interact" with the page first (try clicking in the blank space). This isn't a problem for browser sources, thankfully

# Support
If you need support, feel free to open an issue! However, please note that we *can not* provide support related to hosting- we can only help if something directly related to the program breaks

If you'd like to support *us*, we've got a [Patreon](https://patreon.com/selenated) and a [Ko-Fi](https://ko-fi.com/selenated) you can chuck some money at, if you're interested. No pressure though 🧡
