// Reproductor único de la app. Un solo <video> vive en una capa global y nunca cambia de padre:
// la vista completa y el mini solo cambian el modo (mode), y la página decide cómo se ve.
// Estados: idle, playing, paused, ended. Recuerda la posición de cada archivo mientras la app esté abierta.
(function (root) {
	var video = null;
	var current = null;
	var state = 'idle';
	var mode = 'mini';
	var pendingSeek = 0;
	var positions = {};
	var listeners = [];
	var startHook = null;

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
			setState('paused');
		});
		video.addEventListener('ended', function () {
			if (!current) return;
			positions[current.id] = 0;
			setState('ended');
		});
		video.addEventListener('loadedmetadata', function () {
			if (pendingSeek > 0) {
				video.currentTime = pendingSeek;
				pendingSeek = 0;
			}
		});
	}

	// Inicia un archivo en vista completa. Usa la posición guardada si existe.
	function play(file, url) {
		if (!video) throw new Error('CodePlayer: falta init(video)');
		savePosition();
		current = file;
		pendingSeek = positions[file.id] || 0;
		video.src = url;
		mode = 'full';
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

	// Cierra el reproductor: detiene, guarda la posición y oculta el mini. La música queda en pausa.
	function close() {
		if (!current) return;
		savePosition();
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

	root.CodePlayer = {
		init: init,
		play: play,
		toggle: toggle,
		close: close,
		setMode: setMode,
		subscribe: subscribe,
		snapshot: snapshot,
		onStart: function (fn) { startHook = fn; },
	};
})(window);
