export function joinUrl(parts: string[], sep: string = '/'): string {
	return parts.map((part) => {
		const copy = part.endsWith(sep) ? part.substring(0, part.length - 1) : part;
		return copy.startsWith(sep) ? copy.substr(1) : copy;
	}).join(sep);
}