export async function copyText(text: string): Promise<boolean> {
	try {
		if (navigator.clipboard) {
			await navigator.clipboard.writeText(text);
			return true;
		}
	} catch {
		return legacyCopy(text);
	}
	return legacyCopy(text);
}

function legacyCopy(text: string): boolean {
	const el = document.createElement('textarea');
	el.value = text;
	el.setAttribute('readonly', '');
	el.style.position = 'fixed';
	el.style.top = '-1000px';
	document.body.appendChild(el);
	el.select();
	const ok = execCopy();
	document.body.removeChild(el);
	return ok;
}

function execCopy(): boolean {
	try {
		return document.execCommand('copy');
	} catch {
		return false;
	}
}
