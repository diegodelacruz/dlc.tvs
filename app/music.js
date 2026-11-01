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

	// Estado de solo lectura para la interfaz (pista actual, si suena, aleatorio y repetir). La interfaz nunca toca el <audio> directamente.
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

	// Avisa a todos los suscriptores del cambio de estado, para que pantallas y barra se actualicen juntas.
	function emit() {
		listeners.forEach(function (fn) { fn(snapshot()); });
	}

	// Conecta el <audio> de música. Los eventos del elemento actualizan el estado y pasan a la siguiente pista al terminar.
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

	// Recalcula el orden de reproducción (normal o aleatorio) manteniendo la pista actual como punto de partida.
	function rebuildOrder(startIndex) {
		order = root.CodeLogic.playOrder(queue.length, shuffle, Math.random);
		pos = startIndex !== undefined && startIndex >= 0 ? order.indexOf(startIndex) : -1;
	}

	// Carga una pista pidiendo su URL justo antes de usarla, así no se piden URLs de toda la lista.
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

	// Reproduce o pausa. Si el navegador rechaza el play (política de autoplay), el error se ignora para no bloquear la app.
	function toggle() {
		if (!audio || !audio.src) return;
		if (audio.paused) {
			var p = audio.play();
			if (p && p.catch) p.catch(function () {});
		} else {
			audio.pause();
		}
	}

	// Pasa a la siguiente pista según el orden y la opción de repetir; si no hay más, se detiene.
	function next() {
		var n = root.CodeLogic.nextPosition(pos, order.length, repeat);
		if (n < 0) {
			emit();
			return Promise.resolve();
		}
		return load(n, urlFunction);
	}

	// Si la pista lleva más de 3 s, vuelve al inicio; si no, va a la anterior. Es el comportamiento habitual de los reproductores.
	function previous() {
		if (audio && audio.currentTime > 3) {
			audio.currentTime = 0;
			return Promise.resolve();
		}
		return load(root.CodeLogic.previousPosition(pos), urlFunction);
	}

	// Activa o desactiva el aleatorio conservando la pista que suena, para que no cambie al mover el interruptor.
	function setShuffle(on) {
		var currentItem = pos >= 0 ? queue[order[pos]] : null;
		shuffle = on;
		rebuildOrder(currentItem ? queue.indexOf(currentItem) : 0);
		emit();
	}

	// Activa o desactiva repetir; el cambio se aplica en la siguiente decisión de next().
	function setRepeat(on) {
		repeat = on;
		emit();
	}

	// Pausa la música sin cambiar la posición ni la cola. La usa el reproductor de video al empezar.
	function pause() {
		if (audio && !audio.paused) audio.pause();
	}

	// Recibe la función que convierte un archivo en URL reproducible. Así music.js no conoce a Drive ni al proxy.
	function setUrlFunction(fn) {
		urlFunction = fn;
	}

	// Registra una función que recibe el estado y la llama de inmediato con el estado actual.
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
