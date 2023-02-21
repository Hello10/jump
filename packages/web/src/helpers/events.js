export function ignoreEvent(event) {
	console.log('Ignoring click')
	event.preventDefault()
}

export const events = {
	ignore: ignoreEvent
}