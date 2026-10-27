// Reproductor único de la app. Un solo <video> vive en una capa global y nunca cambia de padre:
// la vista completa y el mini solo cambian el modo (mode), y la página decide cómo se ve.
// Estados: idle, playing, paused, ended. Recuerda la posición de cada archivo mientras la app esté abierta
// y avisa del progreso (onProgress) para guardarlo entre sesiones.
(function (root) {
	var video = null;
	var current = null;
	var state = 'idle';
	var mode = 'mini';
	var pendingSeek = 0;
	var positions = {};
	var listeners = [];
	var startHook = null;
	var progressHooks = [];
	var lastTick = 0;

	function snapshot() {
		return { file: current, state: state, mode: mode };
	}

	function emit() {
		listeners.forEach(function (fn) { fn(snapshot()); });
	}

	function setState(next) {
		state = next;
		emit();
	}

	function reportProgress(ended) {
		if (!current || !video) return;
		progressHooks.forEach(function (fn) {
			fn(current, ended ? 0 : video.currentTime, video.duration || 0, ended);
		});
	}

	function savePosition() {
		if (current && video && state !== 'ended') positions[current.id] = video.currentTime;
	}

	function init(el) {
		video = el;
		video.addEventListener('playing', function () {
			if (current) setState('playing');
		});
		video.addEventListener('pause', function () {
			if (!current || state === 'ended') return;
			savePosition();
			reportProgress(false);
			setState('paused');
		});
		video.addEventListener('ended', function () {
			if (!current) return;
			positions[current.id] = 0;
			reportProgress(true);
			setState('ended');
		});
		video.addEventListener('timeupdate', function () {
			if (!current || state !== 'playing') return;
			var now = Date.now();
			if (now - lastTick < 5000) return;
			lastTick = now;
			savePosition();
			reportProgress(false);
		});
		video.addEventListener('loadedmetadata', function () {
			if (pendingSeek > 0) {
				video.currentTime = pendingSeek;
				pendingSeek = 0;
			}
		});
	}

	// Inicia un archivo en vista completa. Si se indica startAt se usa esa posición; si no, la última guardada.
	function play(file, url, startAt) {
		if (!video) throw new Error('CodePlayer: falta init(video)');
		savePosition();
		current = file;
		pendingSeek = startAt !== undefined ? startAt : (positions[file.id] || 0);
		video.src = url;
		mode = 'full';
		lastTick = 0;
		if (startHook) startHook(file);
		var promise = video.play();
		if (promise && promise.catch) promise.catch(function () {});
		emit();
	}

	// OK sobre el botón de reproducir/pausa. Si terminó, vuelve al inicio.
	function toggle() {
		if (!current) return;
		if (state === 'ended') {
			video.currentTime = 0;
			var promise = video.play();
			if (promise && promise.catch) promise.catch(function () {});
		} else if (video.paused) {
			var resumed = video.play();
			if (resumed && resumed.catch) resumed.catch(function () {});
		} else {
			video.pause();
		}
	}

	// Avanza o retrocede delta segundos, dentro del archivo.
	function seekBy(delta) {
		if (!current || !video) return;
		var max = video.duration || 0;
		video.currentTime = Math.max(0, Math.min(max, video.currentTime + delta));
	}

	// Cierra el reproductor: detiene, guarda la posición y oculta el mini. La música queda en pausa.
	function close() {
		if (!current) return;
		savePosition();
		reportProgress(false);
		current = null;
		video.pause();
		setState('idle');
	}

	function setMode(next) {
		mode = next;
		emit();
	}

	function subscribe(fn) {
		listeners.push(fn);
		fn(snapshot());
	}

	// Tiempo y duración actuales (0 si no hay archivo).
	function status() {
		if (!current || !video) return { time: 0, duration: 0 };
		return { time: video.currentTime, duration: video.duration || 0 };
	}

	root.CodePlayer = {
		init: init,
		play: play,
		toggle: toggle,
		seekBy: seekBy,
		close: close,
		setMode: setMode,
		subscribe: subscribe,
		snapshot: snapshot,
		status: status,
		onStart: function (fn) { startHook = fn; },
		onProgress: function (fn) { progressHooks.push(fn); },
	};
})(typeof window !== 'undefined' ? window : globalThis);
