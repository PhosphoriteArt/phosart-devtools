const MIME_TO_EXT: Record<string, string> = {
	'image/jpg': 'jpeg',
	'image/jpeg': 'jpeg',
	'image/png': 'png'
};

export function getImageExtension(mime: string): string {
	return MIME_TO_EXT[mime] ?? 'bin';
}
