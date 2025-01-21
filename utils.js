module.exports = {
	async sleep(ms) {
		return new Promise(res => {
			setTimeout(() => res(), ms ?? 1000)
		})
	},
	splice(str, start, end, add) {
		return (
			str.slice(0, start) +
			(add || '') +
			str.slice(start + end)
		)
	},

	splitToSpans(str) {
		return (
			str.split('')
			.map(s => `<span>${s}</span>`)
			.join('')
		);
	}
}