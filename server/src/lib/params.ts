export function paramsEqual(a: URLSearchParams, b: URLSearchParams): boolean {
	const ka = [...a.keys()].sort();
	const kb = [...b.keys()].sort();
	if (ka.length !== kb.length || ka.some((k, i) => k !== kb[i])) return false;
	return ka.every((k) => a.getAll(k).join('\u0000') === b.getAll(k).join('\u0000'));
}
