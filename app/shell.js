// Shell de la app: barra superior, reproductor (mini y vista completa), controles y reglas de Atrás.
// - OK sobre una pestaña la abre. Mover el foco no cambia de sección.
// - El <video> vive siempre dentro de #stage. Mini y vista completa solo cambian su posición y tamaño.
// - Vista completa: foco en la barra de progreso. Izquierda/derecha saltan 10 s; OK pausa; las demás flechas navegan.
// - Atrás: primero lo consume la pantalla (CodeScreens.back), luego la vista completa, y por último vuelve a Inicio.
//   En Inicio no se intercepta: el sistema decide.
(function (root) {
	var SECTIONS = ['inicio', 'explorar', 'video', 'musica', 'fotos', 'ajustes'];
	var RELOADABLE = ['explorar', 'musica', 'fotos'];
	var CP = root.CodePlayer;
	var ICON = root.CodeIcons.icon;
	var L = root.CodeLogic;
	var SKIP_S = 10;
	// Velocidades de avance (playbackRate) y de retroceso (salto hacia atrás cada 250 ms). Por defecto 1x.
	var RATES = [0.5, 1, 1.5, 2, 5, 10];
	var rate = { fwd: 1, rew: 1, rewTimer: null };
	var PREV_RESTART_S = 5;
	var current = 'inicio';
	var inFull = false;
	var CHROME_MS = 4000;
	var chromeTimer = null;
	var lastTracksLabel = '';
	var sectionHistory = [];
	// Lista de reproducción: videos en orden alfabético desde donde se eligió el video.
	var queue = [];
	var queueIndex = -1;
	var miniPrev = document.getElementById('mini-prev');
	var miniNext = document.getElementById('mini-next');
	var fullPrev = document.getElementById('full-prev');
	var fullNext = document.getElementById('full-next');
	var loadTimer = null;
	var LOAD_MS = 30000;
	var playingSeen = false;
	var ERROR_CODES = { 1: 'cancelado', 2: 'error de red', 3: 'error al decodificar', 4: 'formato no soportado por la TV' };

	var app = document.getElementById('app');
	var stage = document.getElementById('stage');
	var slot = document.getElementById('mini-slot');
	var player = document.getElementById('player');
	var mini = document.getElementById('mini');
	var miniState = document.getElementById('mini-state');
	var settingsBtn = document.getElementById('settings-btn');
	var miniFull = document.getElementById('mini-full');
	var miniToggle = document.getElementById('mini-toggle');
	var miniClose = document.getElementById('mini-close');
	var miniSize = document.getElementById('mini-size');
	var miniCorner = document.getElementById('mini-corner');
	var pill = document.getElementById('now-pill');
	var pillArt = document.getElementById('pill-art');
	var pillTitle = document.getElementById('pill-title');
	var fullTitle = document.getElementById('full-title');
	var fullMeta = document.getElementById('full-meta');
	var fullProgress = document.getElementById('full-progress');
	var fullTime = document.getElementById('full-time');
	var fullDuration = document.getElementById('full-duration');
	var barFill = document.getElementById('bar-fill');
	var barKnob = document.getElementById('bar-knob');
	var fullBack = document.getElementById('full-back');
	var fullToggle = document.getElementById('full-toggle');
	var fullFwd = document.getElementById('full-fwd');
	var fullRew = document.getElementById('full-rew');
	var fullFf = document.getElementById('full-ff');
	var fullTracks = document.getElementById('full-tracks');
	var fullControls = document.getElementById('full-controls');
	var fileExt = '';
	var busyEl = document.getElementById('busy');
	var busyText = document.getElementById('busy-text');
	// Cada carga tiene un número; si llega otra antes de terminar, la anterior se ignora.
	var loadToken = 0;
	var expectPop = false;
	// Atrás atendidos por tecla cuyo evento de historial aún puede llegar (el sistema lo repite).
	var echoes = 0;
	// Último Atrás que llegó por el historial (sin tecla) en vista normal.
	var lastPopBackAt = 0;
	var miniHideTimer = null;
	// Proporción del video (ancho/alto). El mini la toma para no mostrar franjas.
	var videoRatio = 16 / 9;
	var MINI_MAX_H = 540;

	var STATE_TEXT = { playing: 'Reproduciendo', paused: 'En pausa', ended: 'Terminado', idle: '' };

	function tabFor(name) {
		return app.querySelector('[data-section="' + name + '"]');
	}

	// Sección anterior: Atrás vuelve a ella. fromBack evita volver a apilar la sección que se deja.
	function show(name, fromBack) {
		if (SECTIONS.indexOf(name) < 0) return;
		if (!fromBack && name !== current) sectionHistory.push(current);
		if (name !== current) root.CodeScreens.leave(current);
		current = name;
		updateReloadButton();
		updateScrollInd();
		if (name !== 'inicio') armSentinel();
		SECTIONS.forEach(function (s) {
			document.getElementById('sec-' + s).hidden = (s !== name);
			var tab = tabFor(s);
			if (tab.classList.contains('tab')) {
				tab.className = 'tab' + (s === name ? ' current' : '');
			}
			if (s === name) tab.setAttribute('aria-current', 'page');
			else tab.removeAttribute('aria-current');
		});
		window.scrollTo(0, 0);
		root.CodeScreens.enter(name);
		// Si la pantalla no dejó el foco en su contenido, va al primer elemento de la sección.
		var section = document.getElementById('sec-' + name);
		if (!section.contains(document.activeElement)) {
			var first = section.querySelector('a');
			if (first) first.focus();
		}
	}

	// Aviso visible en la pantalla: los errores de reproducción y de conexión se leen aquí, no solo en consola.
	function notify(text) {
		console.error('CodeTV: ' + text);
		root.CodeErrors.record('Reproducción', text);
		var box = document.getElementById('notice');
		box.textContent = text;
		box.hidden = false;
	}

	function clearNotice() {
		document.getElementById('notice').hidden = true;
	}

	// Comprueba que el proxy responda antes de reproducir. Devuelve '' si todo está bien, o el motivo.
	function probeStream(url) {
		return fetch(url, { headers: { Range: 'bytes=0-0' } }).then(function (res) {
			if (res.ok || res.status === 206) return '';
			return res.text().then(function (body) {
				return 'El proxy respondió ' + res.status + ': ' + (body || 'sin detalle');
			});
		}, function () {
			return 'No hay conexión con el proxy. Revisa que esté corriendo y que la IP de PROXY_BASE sea la de la Mac.';
		});
	}

	function armLoadTimer() {
		clearTimeout(loadTimer);
		playingSeen = false;
		loadTimer = setTimeout(function () {
			if (!playingSeen) notify('El video no empieza tras ' + (LOAD_MS / 1000) + ' s. Revisa la red y que el proxy esté encendido.');
		}, LOAD_MS);
	}

	// Coloca #stage encima del hueco del mini (modo mini) o de toda la pantalla (vista completa).
	function placeStage(s) {
		if (!s.file) {
			stage.className = '';
			return;
		}
		if (s.mode === 'full') {
			stage.className = 'full';
			stage.style.left = '0px';
			stage.style.top = '0px';
			stage.style.width = window.innerWidth + 'px';
			stage.style.height = window.innerHeight + 'px';
			return;
		}
		var r = slot.getBoundingClientRect();
		// Normal y grande: proporciones intermedias entre el tamaño anterior (1x y 2x) y lo que se ve bien en la TV.
		var scale = root.CodeStore.settings().miniSize === 'grande' ? 1.75 : 1.35;
		var bottom = root.CodeStore.settings().miniCorner === 'abajo';
		var width = r.width * scale;
		var height = width / videoRatio;
		// Un video vertical no debe tapar la pantalla: si la altura pasa del máximo, se reduce el ancho.
		if (height > MINI_MAX_H) {
			height = MINI_MAX_H;
			width = height * videoRatio;
		}
		stage.className = 'mini';
		stage.style.width = width + 'px';
		stage.style.height = height + 'px';
		stage.style.left = (r.right - width) + 'px';
		stage.style.top = (bottom ? window.innerHeight - height - 24 : r.top) + 'px';
	}

	// Tarjeta de música en la barra: pista actual, o nada si no hay.
	function renderPill(musicState) {
		var item = musicState ? musicState.item : CodeMusicSnapshot().item;
		var show = Boolean(item) && !(CP.snapshot().file && !inFull);
		pill.hidden = !show;
		if (!item) return;
		var playing = musicState ? musicState.playing : CodeMusicSnapshot().playing;
		pillArt.innerHTML = ICON('wave', 28);
		pillTitle.textContent = L.titleOf(item.name) + (playing ? '' : ' · en pausa');
	}

	function CodeMusicSnapshot() {
		return root.CodeMusic.snapshot();
	}

	// Controles de la vista completa: aparecen con una tecla y se ocultan solos. Atrás los oculta primero.
	function chromeOn() {
		return stage.hasAttribute('data-chrome');
	}

	function armChrome() {
		clearTimeout(chromeTimer);
		chromeTimer = null;
		if (trackPanel.isOpen()) return;
		chromeTimer = setTimeout(hideChrome, CHROME_MS);
	}

	// Muestra los controles sin mover el foco (lo usa el puntero).
	function revealChrome() {
		stage.setAttribute('data-chrome', '');
		updateFullTime();
		armChrome();
	}

	// Muestra los controles y lleva el foco a la barra (lo usan las teclas).
	function showChrome() {
		revealChrome();
		fullProgress.focus();
	}

	function hideChrome() {
		clearTimeout(chromeTimer);
		chromeTimer = null;
		stage.removeAttribute('data-chrome');
		var active = document.activeElement;
		if (active && document.getElementById('full-controls').contains(active)) active.blur();
	}

	// Pistas activas: se muestran como subtítulo del encabezado, no dentro de los botones.
	function updateTracksLabel() {
		var label = trackPanel.summary();
		if (label === lastTracksLabel) return;
		lastTracksLabel = label;
		fullMeta.textContent = (fileExt ? fileExt + ' · ' : '') + label;
	}

	function updateFullTime() {
		var st = CP.status();
		var pct = st.duration ? Math.min(100, (st.time / st.duration) * 100) : 0;
		barFill.style.width = pct + '%';
		barKnob.style.left = pct + '%';
		fullTime.textContent = L.formatTime(st.time);
		// Tiempo restante en la misma línea, con signo menos.
		fullDuration.textContent = '-' + L.formatTime(Math.max(0, st.duration - st.time));
		renderToggle();
		updateTracksLabel();
	}

	function render(s) {
		if (typeof updateScrollInd === 'function' && scrollInd) updateScrollInd();
		var wasFull = inFull;
		inFull = s.file !== null && s.mode === 'full';
		player.controls = false;
		if (inFull) {
			stage.setAttribute('data-modal', '');
			if (s.file) {
				fullTitle.textContent = L.titleOf(s.file.name);
				fileExt = L.extOf(s.file.name);
				lastTracksLabel = '';
			}
		} else {
			stage.removeAttribute('data-modal');
			if (trackPanel.isOpen()) trackPanel.close();
		}
		placeStage(s);
		// Al entrar, los controles aparecen un momento con el foco en la barra; el reproductor ya está visible.
		if (inFull && !wasFull) showChrome();
		if (!inFull) hideChrome();
		mini.className = (s.file && !inFull) ? 'show' : '';
		if (s.file && !inFull) {
			miniState.textContent = s.file.name + ' · ' + STATE_TEXT[s.state];
			miniToggle.innerHTML = ICON(s.state === 'playing' ? 'pause' : 'play', 16);
		}
		updateFullTime();
		renderPill(null);
	}

	// Entrar a vista completa agrega una entrada al historial; Atrás la quita y vuelve al mini.
	function goFull() {
		if (!inFull) {
			if (document.activeElement) document.activeElement.blur();
			CP.setMode('full');
			history.pushState({ full: true }, '');
		}
	}

	// Sale de vista completa. Solo usa el historial si la entrada la creó la app; si no, cambia el modo.
	// Atrás en la vista normal, en orden: cierra el menú de audio, oculta los controles, y al final sale al mini.
	// popped: true si el sistema ya quitó la entrada del reproductor; entonces hay que volver a dejarla.
	function handleFullBack(popped) {
		if (trackPanel.isOpen()) {
			trackPanel.close();
			if (popped) history.pushState({ full: true }, '');
			return;
		}
		if (chromeOn()) {
			hideChrome();
			if (popped) history.pushState({ full: true }, '');
			return;
		}
		if (popped) {
			CP.setMode('mini');
			miniFull.focus();
			return;
		}
		leaveFull();
	}

	function leaveFull() {
		if (history.state && history.state.full) {
			// La entrada del reproductor se quita aquí; su evento de historial no debe tratarse como Atrás.
			expectPop = true;
			CP.setMode('mini');
			history.back();
		} else {
			CP.setMode('mini');
		}
		miniFull.focus();
	}

	// Indicador de carga visible en cualquier pantalla, desde el clic hasta que empieza el video.
	function setBusy(on) {
		busyEl.hidden = !on;
	}

	function expectEcho() {
		echoes++;
		setTimeout(function () { if (echoes > 0) echoes--; }, 3000);
	}

	function cancelLoad() {
		loadToken++;
		setBusy(false);
	}

	function indexById(list, id) {
		for (var i = 0; i < list.length; i++) {
			if (list[i].id === id) return i;
		}
		return -1;
	}

	// Anterior y siguiente: sin destino quedan atenuados y sin enlace, así no se pueden enfocar.
	function setNav(a, enabled) {
		if (enabled) a.setAttribute('href', '#');
		else a.removeAttribute('href');
		a.classList.toggle('disabled', !enabled);
	}

	function updateNavButtons() {
		var prev = queueIndex > 0;
		var next = queueIndex >= 0 && queueIndex < queue.length - 1;
		setNav(miniPrev, prev);
		setNav(fullPrev, prev);
		setNav(miniNext, next);
		setNav(fullNext, next);
	}

	// Ajusta la lista: la que llega desde la pantalla, o la que ya estaba, o toda la biblioteca.
	function ensureQueue(file, list) {
		if (list && indexById(list, file.id) >= 0) {
			queue = list;
			queueIndex = indexById(list, file.id);
			updateNavButtons();
			return Promise.resolve();
		}
		if (indexById(queue, file.id) >= 0) {
			queueIndex = indexById(queue, file.id);
			updateNavButtons();
			return Promise.resolve();
		}
		// Sin lista (p. ej. desde Continuar viendo): el siguiente es el de la misma carpeta de origen.
		return root.CodeDrive.crawl(['video']).then(function (items) {
			var folder = L.folderOf(file.path);
			var scope = folder === null ? items : items.filter(function (i) { return L.folderOf(i.path) === folder; });
			queue = L.sortItems(scope, 'name');
			queueIndex = indexById(queue, file.id);
			updateNavButtons();
		});
	}


	function nextVideo() {
		if (queueIndex >= 0 && queueIndex < queue.length - 1) playVideo(queue[queueIndex + 1], 0);
	}

	// Con más de 5 s vistos, anterior vuelve al inicio del mismo video; si no, va al video anterior.
	function prevVideo() {
		if (CP.status().time > PREV_RESTART_S) {
			CP.seekBy(-CP.status().time);
			return;
		}
		if (queueIndex > 0) playVideo(queue[queueIndex - 1], 0);
	}

	// Reproduce un archivo de video desde una posición (o desde el inicio). list: lista de la que sale el video.
	// Velocidades: avance cambia playbackRate; retroceso salta hacia atrás a intervalos (el video queda en pausa).
	// El audio solo suena a 1x: en cualquier otra velocidad se silencia y se indica en el botón.
	function applyForwardRate() {
		player.playbackRate = RATES[rate.fwd];
		player.muted = RATES[rate.fwd] !== 1;
	}

	function showRates() {
		document.getElementById('ff-rate').textContent = RATES[rate.fwd] + 'x';
		document.getElementById('rew-rate').textContent = (rate.rewTimer ? '-' : '') + RATES[rate.rew] + 'x';
		renderToggle();
	}

	// Botón central: reproducir/pausar, o volver a 1x mientras avanzas a otra velocidad.
	function renderToggle() {
		if (rate.fwd !== 1 && !rate.rewTimer) {
			fullToggle.innerHTML = ICON('cycle', 30);
			fullToggle.setAttribute('aria-label', 'Volver a 1x');
		} else {
			fullToggle.innerHTML = ICON(player.paused ? 'play' : 'pause', 30);
			fullToggle.setAttribute('aria-label', 'Reproducir o pausar');
		}
	}

	function stopRewind() {
		if (rate.rewTimer) clearInterval(rate.rewTimer);
		rate.rewTimer = null;
	}

	function rewindStep() {
		CP.seekBy(-RATES[rate.rew]);
		if (CP.status().time <= 0.5) stopRewind();
		showRates();
	}

	function pressRewind() {
		rate.rew = (rate.rew + 1) % RATES.length;
		player.playbackRate = 1;
		player.pause();
		stopRewind();
		rate.rewTimer = setInterval(rewindStep, 1000);
		showRates();
	}

	// Control de posición tras cambiar la velocidad (mitigación): si el video queda atrás de la posición
	// esperada más de 1.5 s, se corrige a esa posición y se registra. No cambia la velocidad elegida.
	var speedChangeId = 0;
	function changeSpeed(apply) {
		var id = ++speedChangeId;
		var wasPlaying = !player.paused;
		apply();
		if (!wasPlaying) return;
		var t0 = player.currentTime;
		var at = Date.now();
		var r = player.playbackRate;
		setTimeout(function () {
			if (id !== speedChangeId || player.paused) return;
			var expected = t0 + (Date.now() - at) / 1000 * r;
			if (expected >= (player.duration || Infinity)) return;
			var now = player.currentTime;
			if (now < expected - 1.5) {
				root.CodeErrors.record('Reproducción', 'La posición retrocedió al cambiar la velocidad a ' + r + 'x: de ' +
					Math.round(expected) + ' s esperados a ' + Math.round(now) + ' s. Se corrigió.');
				player.currentTime = expected;
			}
		}, 1500);
	}

	function pressForward() {
		stopRewind();
		rate.fwd = (rate.fwd + 1) % RATES.length;
		changeSpeed(function () {
			applyForwardRate();
			if (player.paused && CP.snapshot().file) {
				var p = player.play();
				if (p && p.catch) p.catch(function () {});
			}
		});
		showRates();
	}

	// Un video nuevo empieza a 1x en ambos sentidos.
	function resetRates() {
		stopRewind();
		rate.fwd = 1;
		rate.rew = 1;
		applyForwardRate();
		showRates();
	}

	function playVideo(file, startAt, list) {
		resetRates();
		var wasFull = inFull;
		// Si ya hay un video en el mini, el siguiente o el anterior se reproducen en el mini.
		var keepMini = CP.snapshot().file !== null && CP.snapshot().mode === 'mini';
		var token = ++loadToken;
		clearNotice();
		setBusy(true);
		ensureQueue(file, list).then(function () {
			return root.CodeDrive.urlFor(file);
		}).then(function (url) {
			if (token !== loadToken) return;
			var check = root.CodeDrive.hasProxy() ? probeStream(url) : Promise.resolve('');
			return check.then(function (problem) {
				if (token !== loadToken) return;
				if (problem) {
					setBusy(false);
					notify('No se pudo abrir "' + file.name + '": ' + problem);
					return;
				}
				CP.play(file, url, startAt || 0);
				if (keepMini) CP.setMode('mini');
				armLoadTimer();
				root.CodeTracks.loadSubtitles(player, url);
				root.CodeScreens.remember(file);
				if (!wasFull && !keepMini) history.pushState({ full: true }, '');
			});
		}).catch(function (e) {
			if (token !== loadToken) return;
			setBusy(false);
			notify('No se pudo abrir "' + file.name + '": ' + (e && e.message ? e.message : String(e)));
		});
	}

	// Al terminar, sigue con el siguiente video de la lista (si hay).
	player.addEventListener('ended', function () {
		if (queueIndex >= 0 && queueIndex < queue.length - 1) nextVideo();
	});

	// Errores del propio <video>: se muestran con su código, no quedan en silencio.
	player.addEventListener('error', function () {
		clearTimeout(loadTimer);
		setBusy(false);
		var err = player.error;
		var code = err ? err.code : 0;
		notify('La TV no pudo reproducir el archivo (código ' + code + ': ' + (ERROR_CODES[code] || 'desconocido') + ').' +
			(err && err.message ? ' Detalle: ' + err.message : ''));
		if (inFull) showChrome();
	});
	// Búfer vacío: el video espera datos. Se indica con un giro encima del video, sin texto.
	player.addEventListener('waiting', function () {
		if (busyEl.hidden) stage.setAttribute('data-buffering', '');
	});
	player.addEventListener('playing', function () {
		stage.removeAttribute('data-buffering');
		playingSeen = true;
		setBusy(false);
		clearTimeout(loadTimer);
		clearNotice();
	});

	function saveProgress(file, time, duration, ended) {
		var progress = root.CodeStore.get('progress', {});
		if (ended) {
			delete progress[file.id];
		} else {
			progress[file.id] = { name: file.name, path: file.path || '', time: time, duration: duration, updated: Date.now() };
		}
		root.CodeStore.set('progress', progress);
	}

	// Selector de audio y subtítulos. Mientras está abierto, la navegación queda dentro de él.
	var trackPanel = root.CodeTracks.mount(stage, player, {
		onOpen: function () {
			stage.removeAttribute('data-modal');
			clearTimeout(chromeTimer);
			chromeTimer = null;
		},
		onClose: function () {
			if (inFull) stage.setAttribute('data-modal', '');
			armChrome();
		},
	});

	SECTIONS.forEach(function (name) {
		tabFor(name).onclick = function () {
			show(name);
			return false;
		};
	});

	root.CodeShell = {
		show: show,
		current: function () { return current; },
		playVideo: playVideo,
		goFull: goFull,
		renderPill: renderPill,
	};

	CP.init(player);
	CP.subscribe(render);
	CP.onProgress(saveProgress);
	CP.onStart(function () { root.CodeMusic.pause(); });

	miniFull.onclick = function () { goFull(); return false; };
	miniToggle.onclick = function () { CP.toggle(); return false; };
	miniClose.onclick = function () {
		CP.close();
		tabFor(current).focus();
		return false;
	};

	pill.onclick = function () { show('musica'); return false; };

	// Controles del mini: aparecen al llegar el foco (control remoto) y se ocultan solos.
	stage.addEventListener('focusin', function () {
		if (!stage.classList.contains('mini')) return;
		stage.setAttribute('data-mini-chrome', '');
		clearTimeout(miniHideTimer);
		miniHideTimer = setTimeout(function () { stage.removeAttribute('data-mini-chrome'); }, 3000);
	});

	fullProgress.onclick = function () { CP.toggle(); return false; };
	fullBack.onclick = function () { CP.seekBy(-SKIP_S); return false; };
	fullToggle.onclick = function () {
		// Con avance a otra velocidad, este botón vuelve a 1x; si no, reproduce o pausa.
		if (rate.fwd !== 1 && !rate.rewTimer) {
			rate.fwd = 1;
			changeSpeed(applyForwardRate);
			showRates();
			return false;
		}
		stopRewind();
		showRates();
		CP.toggle();
		return false;
	};
	fullFwd.onclick = function () { CP.seekBy(SKIP_S); return false; };
	fullRew.onclick = function () { pressRewind(); return false; };
	fullFf.onclick = function () { pressForward(); return false; };
	fullTracks.onclick = function () { trackPanel.open(this); return false; };

	fullBack.innerHTML = ICON('skipBack', 22);
	fullFwd.innerHTML = ICON('skipFwd', 22);
	fullRew.innerHTML = ICON('back10', 22) + '<span class="rate" id="rew-rate"></span>';
	fullFf.innerHTML = ICON('fwd10', 22) + '<span class="rate" id="ff-rate"></span>';
	fullTracks.innerHTML = ICON('subtitles', 22);
	fullToggle.innerHTML = ICON('pause', 24);
	document.getElementById('settings-btn').innerHTML = ICON('gear', 34);
	var reloadBtn = document.getElementById('reload-btn');
	reloadBtn.innerHTML = ICON('cycle', 30);
	reloadBtn.onclick = function () {
		root.CodeScreens.reload(current);
		return false;
	};
	// Solo en las secciones que muestran archivos de Drive.
	function updateReloadButton() {
		reloadBtn.hidden = RELOADABLE.indexOf(current) < 0;
	}
	updateReloadButton();
	miniFull.innerHTML = ICON('fullscreen', 16);
	miniSize.innerHTML = ICON('zoom', 16);
	miniCorner.innerHTML = ICON('corner', 16);
	miniPrev.innerHTML = ICON('prev', 16);
	miniNext.innerHTML = ICON('next', 16);
	fullPrev.innerHTML = ICON('prev', 22);
	fullNext.innerHTML = ICON('next', 22);
	miniPrev.onclick = function () { prevVideo(); return false; };
	miniNext.onclick = function () { nextVideo(); return false; };
	fullPrev.onclick = function () { prevVideo(); return false; };
	fullNext.onclick = function () { nextVideo(); return false; };
	miniClose.innerHTML = ICON('close', 16);
	miniCorner.onclick = function () {
		var next = root.CodeStore.settings().miniCorner === 'abajo' ? 'arriba' : 'abajo';
		root.CodeStore.saveSettings({ miniCorner: next });
		placeStage(CP.snapshot());
		return false;
	};
	miniSize.onclick = function () {
		var next = root.CodeStore.settings().miniSize === 'grande' ? 'normal' : 'grande';
		root.CodeStore.saveSettings({ miniSize: next });
		placeStage(CP.snapshot());
		return false;
	};

	player.addEventListener('loadedmetadata', function () {
		if (player.videoWidth && player.videoHeight) {
			videoRatio = player.videoWidth / player.videoHeight;
			placeStage(CP.snapshot());
		}
	});

	player.addEventListener('timeupdate', function () {
		if (inFull) updateFullTime();
	});
	player.addEventListener('play', updateFullTime);
	player.addEventListener('pause', updateFullTime);

	window.addEventListener('popstate', function () {
		if (expectPop) {
			expectPop = false;
			if (echoes > 0) echoes--;
			return;
		}
		if (CP.snapshot().mode === 'full') {
			// Si la tecla ya atendió este Atrás, el sistema repite la navegación: se rehace la entrada del reproductor.
			if (echoes > 0) {
				echoes--;
				history.pushState({ full: true }, '');
				return;
			}
			// Atrás llegó primero por el historial: la misma acción, sin repetirla con la tecla.
			lastPopBackAt = Date.now();
			handleFullBack(true);
			return;
		}
		// El sistema quitó la entrada centinela: es un Atrás, salvo que la tecla ya lo haya atendido.
		sentinel = false;
		if (echoes > 0) {
			echoes--;
			armSentinel();
			return;
		}
		var result = backOnce();
		if (result === null) {
			armSentinel();
			return;
		}
		if (current === 'inicio') {
			// Atrás en Inicio: sin más historial, el sistema cierra la app.
			if (!result) history.back();
			return;
		}
		armSentinel();
	});

	window.addEventListener('resize', function () { placeStage(CP.snapshot()); });

	// Puntero en el tercio inferior de la vista normal: muestra los controles, sin mover el foco.
	var pointerX = null;
	var pointerY = null;
	document.addEventListener('mousemove', function (e) {
		if (!inFull || trackPanel.isOpen()) return;
		// Un temblor del puntero no cuenta como movimiento: no reinicia el temporizador de ocultar.
		if (pointerX !== null && Math.abs(e.clientX - pointerX) + Math.abs(e.clientY - pointerY) < 6) return;
		pointerX = e.clientX;
		pointerY = e.clientY;
		if (e.clientY >= window.innerHeight * 2 / 3 || fullControls.contains(e.target)) revealChrome();
	});

	// Rueda del Magic Remote: desplaza la página cuando no hay vista completa ni visor.
	document.addEventListener('wheel', function (e) {
		if (inFull || root.CodeScreens.isViewerOpen()) return;
		e.preventDefault();
		window.scrollBy(0, e.deltaY);
	}, { passive: false });

	// ---------- Atrás ----------
	// En webOS, Atrás llega como tecla (keydown) y también puede llegar como navegación del historial
	// (popstate). Fuera de Inicio hay una entrada de historial "centinela": si el sistema la quita,
	// es un Atrás. Si la tecla llega primero, el evento de historial que llegue después se ignora.
	var sentinel = false;
	var lastBackAt = 0;
	var SECTION_NAME = { inicio: 'Inicio', explorar: 'Explorar', video: 'Video', musica: 'Música', fotos: 'Fotos', ajustes: 'Ajustes' };

	function armSentinel() {
		if (!sentinel && !inFull && current !== 'inicio') {
			history.pushState({ codetv: true }, '');
			sentinel = true;
		}
	}

	// Una acción de Atrás fuera de la vista completa. Devuelve el texto de la acción, o '' si no hubo ninguna.
	function handleBack() {
		var label = root.CodeScreens.back();
		if (label) return label;
		if (current === 'inicio') return '';
		var previous = sectionHistory.length ? sectionHistory.pop() : 'inicio';
		show(previous, true);
		return 'Vuelve a ' + SECTION_NAME[previous];
	}

	// Atiende un Atrás una sola vez aunque llegue como tecla y como historial. null = ya atendido.
	function backOnce() {
		if (Date.now() - lastBackAt < 200) return null;
		lastBackAt = Date.now();
		return handleBack();
	}

	// Teclas en fase de captura: se resuelven antes que la navegación (nav.js).
	document.addEventListener('keydown', function (e) {
		var code = e.keyCode;
		var isBack = code === 461 || code === 27 || code === 8;
		// Con una carga en curso, Atrás la cancela.
		if (isBack && !busyEl.hidden) {
			e.preventDefault();
			cancelLoad();
			return;
		}
		if (isBack && inFull) {
			e.preventDefault();
			// Si el historial ya atendió este Atrás hace un instante, no se repite.
			if (Date.now() - lastPopBackAt < 400) return;
			expectEcho();
			handleFullBack(false);
			return;
		}
		if (!inFull) {
			if (!isBack) return;
			var result = backOnce();
			if (result === null) {
				e.preventDefault();
				return;
			}
			// En Inicio sin nada que hacer no se previene: el sistema decide (cerrar la app).
			if (result) {
				e.preventDefault();
				expectEcho();
				armSentinel();
			}
			return;
		}
		// Con los controles ocultos, cualquier tecla los muestra; izquierda/derecha y OK también actúan.
		if (!chromeOn()) {
			if (code === 37) { e.preventDefault(); CP.seekBy(-SKIP_S); showChrome(); }
			else if (code === 39) { e.preventDefault(); CP.seekBy(SKIP_S); showChrome(); }
			else if (code === 13) { e.preventDefault(); CP.toggle(); showChrome(); }
			else if (code === 38 || code === 40) { e.preventDefault(); showChrome(); }
			return;
		}
		armChrome();
		if (document.activeElement !== fullProgress) return;
		if (code === 37) { e.preventDefault(); CP.seekBy(-SKIP_S); updateFullTime(); }
		else if (code === 39) { e.preventDefault(); CP.seekBy(SKIP_S); updateFullTime(); }
		else if (code === 13) { e.preventDefault(); CP.toggle(); }
	}, true);

	var engine = document.getElementById('engine-info');
	if (engine) engine.textContent = navigator.userAgent;

	root.CodeScreens.init();
	// Sección Video desactivada por interruptor (app/flags.js): se oculta su pestaña.
	if (!root.CodeFlags.videoSection) {
		var videoTab = document.querySelector('#tabs a[data-section="video"]');
		if (videoTab) videoTab.hidden = true;
	}
	// Indicador de posición (ascensor): solo en Explorar y solo sobre la región de la lista de archivos.
	var scrollInd = document.getElementById('scroll-ind');
	var scrollThumb = document.getElementById('scroll-thumb');
	// Cada sección con lista tiene una parte fija (arriba) y la lista que se desplaza.
	var LISTS = {
		explorar: { top: document.getElementById('explore-top'), list: document.getElementById('explore-list') },
		musica: { top: document.getElementById('music-top'), list: document.getElementById('music-list') },
		fotos: { top: document.getElementById('photo-top'), list: document.getElementById('photo-grid') },
	};
	var EDGE = 8;
	function updateScrollInd() {
		var wasHidden = scrollInd.hidden;
		scrollInd.hidden = true;
		// Con un video en reproducción (completo o en mini), el indicador no se muestra.
		if (!LISTS[current] || inFull || CP.snapshot().file) return;
		var exploreList = LISTS[current].list;
		var exploreTop = LISTS[current].top;
		var listRect = exploreList.getBoundingClientRect();
		var topRect = exploreTop.getBoundingClientRect();
		// Región visible de la lista: desde debajo del encabezado fijo hasta el borde inferior de la pantalla.
		var r0 = Math.max(topRect.bottom, listRect.top, EDGE);
		var r1 = Math.min(window.innerHeight - EDGE, listRect.bottom);
		var len = r1 - r0;
		var total = listRect.height;
		if (len <= 0 || total <= len + 2) return;
		var a0 = r0 - listRect.top;
		var vis = Math.min(total, a0 + len) - a0;
		var thumbH = Math.max(40, len * vis / total);
		var thumbTop = Math.min(len - thumbH, len * a0 / total);
		scrollInd.style.top = r0 + 'px';
		scrollInd.style.height = len + 'px';
		scrollThumb.style.height = thumbH + 'px';
		scrollThumb.style.top = Math.max(0, thumbTop) + 'px';
		scrollInd.hidden = false;
		if (wasHidden) wakeScrollInd();
	}
	// Semáforo de Ajustes: rojo solo mientras haya errores sin revisar, y solo al navegar (se oculta en reposo).
	var navTimer = null;
	function refreshAlert() {
		settingsBtn.classList.toggle('alert', root.CodeErrors.unseen() > 0);
	}
	function markNavigating() {
		wakeScrollInd();
		settingsBtn.classList.add('nav');
		clearTimeout(navTimer);
		navTimer = setTimeout(function () { settingsBtn.classList.remove('nav'); }, 5000);
	}
	root.CodeErrors.subscribe(refreshAlert);
	refreshAlert();
	document.addEventListener('keydown', markNavigating, true);
	document.addEventListener('mousemove', markNavigating);
	// El indicador se atenúa tras 3 s sin navegar y reaparece con la siguiente tecla, movimiento o desplazamiento.
	var scrollIdleTimer = null;
	function wakeScrollInd() {
		scrollInd.classList.remove('idle');
		clearTimeout(scrollIdleTimer);
		scrollIdleTimer = setTimeout(function () { scrollInd.classList.add('idle'); }, 3000);
	}
	window.addEventListener('scroll', function () { wakeScrollInd(); updateScrollInd(); });
	window.addEventListener('resize', updateScrollInd);
	if (window.ResizeObserver) {
		var scrollObserver = new ResizeObserver(updateScrollInd);
		Object.keys(LISTS).forEach(function (k) {
			scrollObserver.observe(LISTS[k].list);
			scrollObserver.observe(LISTS[k].top);
		});
	} else {
		setInterval(updateScrollInd, 500);
	}

	show('inicio');
	placeStage(CP.snapshot());
	renderPill(null);
	updateNavButtons();

})(window);
