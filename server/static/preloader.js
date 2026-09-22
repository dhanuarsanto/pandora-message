(function () {
	var preloader = document.getElementById('pandora-preloader');
	if (!preloader) return;
	var MIN_MS = 500;
	var start = performance.now();

	function hide() {
		var elapsed = performance.now() - start;
		var wait = Math.max(0, MIN_MS - elapsed);
		setTimeout(function () {
			preloader.classList.add('is-hiding');
			setTimeout(function () {
				preloader.remove();
			}, 350);
		}, wait);
	}

	if (document.readyState === 'complete') {
		hide();
	} else {
		window.addEventListener('load', hide, { once: true });
	}
})();
