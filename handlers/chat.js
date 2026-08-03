import { get } from "axios";
import { splice } from "../utils";
import { EMOTES, ENDPOINTS } from "../constants";

export default async function setup(client) {
	function formatChat(event) {
		var {
			message,
			user,
			state: { id, badges, emotes, color },
		} = event;

		if (badges) {
			var badgeML = Object.entries(badges)
				.map(([b, k]) => {
					let bg = BADGES.find((x) => x.set_id == b)?.versions.find((x) => x.id == k)?.image_url_1x;
					if(bg) return `<img src="${bg}" class="badge" />`;
					else return '';
				})
				.join("\n");
		} else badgeML = "";

		var textML = message;
		if (emotes) {
			for (var [k, v] of Object.entries(emotes)) {
				console.log(k, v);
				for (var a of v) {
					var split = a.split("-");
					var s = parseInt(split[0]);
					var e = parseInt(split[1]);
					textML = splice(
						textML,
						s,
						e,
						`<img src="${EMOTES.replace(":id", k).replace("2.0", "1.0")}" class="emoji" />`,
					);
				}
			}
		}

		var userML =
			`<span style="color: ${color}"><strong>` + user + `</strong></span>`;

		return {
			id,
			badgeML,
			textML,
			userML,
		};
	}

	function formatEmote(event) {
		const { emote, state } = event;

		return {
			id: state.id,
			src: EMOTES.replace(":id", emote),
		};
	}

	socket.addEventListener("chatmessage", ({ message }) => {
		var evt, data;
		if (!state["emote-only"] && state["message-type"] == "chat") {
			evt = "message";
			data = formatChat({
				message,
				user: state.username,
				state,
			});
		} else if (state["emote-only"]) {
			evt = "emote";
			data = formatEmote({
				emote: Object.keys(state.emotes)[0],
				state,
			});
		}

		for (var c of Object.values(evtClients)) {
			c.write(`event: ${evt}\n`);
			c.write(`data: ${JSON.stringify(data)}\n\n`);
		}
	});
};
