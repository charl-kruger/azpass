export function lowerFirst(text: string) {
	if (!text) {
		return text;
	}

	return text[0].toLowerCase() + text.slice(1);
}
