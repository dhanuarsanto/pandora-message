(function () {
	try {
		var saved = localStorage.getItem('pandora-theme');
		var dark =
			saved === 'dark' ||
			(!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
		if (dark) document.documentElement.classList.add('dark');
	} catch {
		// localStorage dapat diblokir browser — abaikan
	}
})();
