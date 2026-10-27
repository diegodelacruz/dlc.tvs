// Reproducción de música en segundo plano. Usa un <audio> propio, separado del <video>.
// Cola, aleatorio y repetir se calculan con CodeLogic. Al iniciar video, la música se pausa (ver shell.js).
(function (root) {
	var audio = null;
	var queue = [];
	var pos = -1;
	var order = [];
	var shuffle = false;
	var repeat = false;
	var listeners = [];

	function snapshot() {
		return {
			item: pos >= 0 && pos < order.length ? queue[order[pos]] : null,
			playing: Boolean(audio && !audio.paused),
			shuffle: shuffle,
			repeat: repeat,
			position: pos,
			length: queue.length,
		};
	}

	function emit() {
		listeners.forEach(function (fn) { fn(snapshot()); });
	}

	function init(el) {
		audio = el;
		audio.addEventListener('play', emit);
		audio.addEventListener('pause', emit);
		audio.addEventListener('ended', function () { next(); });
	}

	// items: archivos de audio; urlFor(item) devuelve una promesa con la URL de reproducción.
	function setQueue(items, startIndex) {
		queue = items.slice();
		rebuildOrder(startIndex || 0);
		emit();
	}

	function rebuildOrder(startIndex) {
		order = root.CodeLogic.playOrder(queue.length, shuffle, Math.random);
		pos = startIndex !== undefined && startIndex >= 0 ? order.indexOf(startIndex) : -1;
	}

	function load(index, urlFor) {
		if (!audio || queue.length === 0) return Promise.resolve();
		pos = index;
		var item = queue[order[pos]];
		return urlFor(item).then(function (url) {
			audio.src = url;
			var p = audio.play();
			if (p && p.catch) p.catch(function () {});
			emit();
		});
	}

	var urlFunction = null;

	// Reproduce la pista del índice visible (posición en la cola ya barajada si aplica).
	function playAt(visibleIndex) {
		var index = order.indexOf(visibleIndex);
		return load(index < 0 ? 0 : index, urlFunction);
	}

	function toggle() {
		if (!audio || !audio.src) return;
		if (audio.paused) {
			var p = audio.play();
			if (p && p.catch) p.catch(function () {});
		} else {
			audio.pause();
		}
	}

	function next() {
		var n = root.CodeLogic.nextPosition(pos, order.length, repeat);
		if (n < 0) {
			emit();
			return Promise.resolve();
		}
		return load(n, urlFunction);
	}

	function previous() {
		if (audio && audio.currentTime > 3) {
			audio.currentTime = 0;
			return Promise.resolve();
		}
		return load(root.CodeLogic.previousPosition(pos), urlFunction);
	}

	function setShuffle(on) {
		var currentItem = pos >= 0 ? queue[order[pos]] : null;
		shuffle = on;
		rebuildOrder(currentItem ? queue.indexOf(currentItem) : 0);
		emit();
	}

	function setRepeat(on) {
		repeat = on;
		emit();
	}

	function pause() {
		if (audio && !audio.paused) audio.pause();
	}

	function setUrlFunction(fn) {
		urlFunction = fn;
	}

	function subscribe(fn) {
		listeners.push(fn);
		fn(snapshot());
	}

	root.CodeMusic = {
		init: init,
		setQueue: setQueue,
		setUrlFunction: setUrlFunction,
		playAt: playAt,
		toggle: toggle,
		next: next,
		previous: previous,
		setShuffle: setShuffle,
		setRepeat: setRepeat,
		pause: pause,
		subscribe: subscribe,
		snapshot: snapshot,
	};
})(window);
