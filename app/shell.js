// Shell de la app: barra superior, reproductor (mini y vista completa), controles y reglas de Atrás.
// - OK sobre una pestaña la abre. Mover el foco no cambia de sección.
// - El <video> vive siempre dentro de #stage. Mini y vista completa solo cambian su posición y tamaño.
// - Vista completa: foco en la barra de progreso. Izquierda/derecha saltan 10 s; OK pausa; las demás flechas navegan.
// - Atrás: primero lo consume la pantalla (CodeScreens.back), luego la vista completa, y por último vuelve a Inicio.
//   En Inicio no se intercepta: el sistema decide.
(function (root) {
	var SECTIONS = ['inicio', 'explorar', 'video', 'musica', 'fotos', 'ajustes'];
	var CP = root.CodePlayer;
	var ICON = root.CodeIcons.icon;
	var L = root.CodeLogic;
	var SKIP_S = 10;
	var current = 'inicio';
	var inFull = false;
	var CHROME_MS = 4000;
	var chromeTimer = null;
	var lastTracksLabel = '';

	var app = document.getElementById('app');
	var stage = document.getElementById('stage');
	var slot = document.getElementById('mini-slot');
	var player = document.getElementById('player');
	var mini = document.getElementById('mini');
	var miniState = document.getElementById('mini-state');
	var miniFull = document.getElementById('mini-full');
	var miniToggle = document.getElementById('mini-toggle');
	var miniClose = document.getElementById('mini-close');
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
	var fullTracks = document.getElementById('full-tracks');

	var STATE_TEXT = { playing: 'Reproduciendo', paused: 'En pausa', ended: 'Terminado', idle: '' };

	function tabFor(name) {
		return app.querySelector('[data-section="' + name + '"]');
	}

	function show(name) {
		if (SECTIONS.indexOf(name) < 0) return;
		current = name;
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
		stage.className = 'mini';
		stage.style.left = r.left + 'px';
		stage.style.top = r.top + 'px';
		stage.style.width = r.width + 'px';
		stage.style.height = r.height + 'px';
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

	function showChrome() {
		stage.setAttribute('data-chrome', '');
		updateFullTime();
		fullProgress.focus();
		armChrome();
	}

	function hideChrome() {
		clearTimeout(chromeTimer);
		chromeTimer = null;
		stage.removeAttribute('data-chrome');
		var active = document.activeElement;
		if (active && document.getElementById('full-controls').contains(active)) active.blur();
	}

	// Texto del botón de audio y subtítulos: muestra la pista activa sin abrir el panel.
	function updateTracksLabel() {
		var label = trackPanel.summary();
		if (label === lastTracksLabel) return;
		lastTracksLabel = label;
		fullTracks.innerHTML = ICON('subtitles', 26) + ' ' + label;
	}

	function updateFullTime() {
		var st = CP.status();
		var pct = st.duration ? Math.min(100, (st.time / st.duration) * 100) : 0;
		barFill.style.width = pct + '%';
		barKnob.style.left = pct + '%';
		fullTime.textContent = L.formatTime(st.time);
		fullDuration.textContent = L.formatTime(st.duration);
		fullToggle.innerHTML = ICON(player.paused ? 'play' : 'pause', 26) + (player.paused ? ' Reproducir' : ' Pausa');
		updateTracksLabel();
	}

	function render(s) {
		var wasFull = inFull;
		inFull = s.file !== null && s.mode === 'full';
		player.controls = false;
		if (inFull) {
			stage.setAttribute('data-modal', '');
			if (s.file) {
				fullTitle.textContent = L.titleOf(s.file.name);
				fullMeta.textContent = L.extOf(s.file.name) + (s.state === 'playing' ? ' · reproduciendo' : '');
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
			miniToggle.textContent = s.state === 'playing' ? 'Pausa' : (s.state === 'ended' ? 'Reiniciar' : 'Reproducir');
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
	function leaveFull() {
		if (history.state && history.state.full) history.back();
		else CP.setMode('mini');
	}

	// Reproduce un archivo de video desde una posición (o desde el inicio).
	function playVideo(file, startAt) {
		var wasFull = inFull;
		root.CodeDrive.urlFor(file).then(function (url) {
			CP.play(file, url, startAt || 0);
			root.CodeTracks.loadSubtitles(player, url);
			root.CodeScreens.remember(file);
			if (!wasFull) history.pushState({ full: true }, '');
		}).catch(function (e) {
			miniState.textContent = 'No se pudo abrir ' + file.name + ': ' + (e && e.message ? e.message : String(e));
		});
	}

	function saveProgress(file, time, duration, ended) {
		var progress = root.CodeStore.get('progress', {});
		if (ended) {
			delete progress[file.id];
		} else {
			progress[file.id] = { name: file.name, time: time, duration: duration, updated: Date.now() };
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

	fullProgress.onclick = function () { CP.toggle(); return false; };
	fullBack.onclick = function () { CP.seekBy(-SKIP_S); return false; };
	fullToggle.onclick = function () { CP.toggle(); return false; };
	fullFwd.onclick = function () { CP.seekBy(SKIP_S); return false; };
	fullTracks.onclick = function () { trackPanel.open(this); return false; };

	fullBack.innerHTML = ICON('back10', 26) + ' 10 s';
	fullFwd.innerHTML = ICON('fwd10', 26) + ' 10 s';
	fullTracks.innerHTML = ICON('subtitles', 26) + ' Audio y subtítulos';
	fullToggle.innerHTML = ICON('pause', 26) + ' Pausa';
	document.getElementById('settings-btn').innerHTML = ICON('gear', 34);

	player.addEventListener('timeupdate', function () {
		if (inFull) updateFullTime();
	});
	player.addEventListener('play', updateFullTime);
	player.addEventListener('pause', updateFullTime);

	window.addEventListener('popstate', function () {
		if (CP.snapshot().mode === 'full') {
			CP.setMode('mini');
			miniFull.focus();
		}
	});

	window.addEventListener('resize', function () { placeStage(CP.snapshot()); });

	// Rueda del Magic Remote: desplaza la página cuando no hay vista completa ni visor.
	document.addEventListener('wheel', function (e) {
		if (inFull || root.CodeScreens.isViewerOpen()) return;
		e.preventDefault();
		window.scrollBy(0, e.deltaY);
	}, { passive: false });

	// Teclas en fase de captura: se resuelven antes que la navegación (nav.js).
	document.addEventListener('keydown', function (e) {
		var code = e.keyCode;
		var isBack = code === 461 || code === 27 || code === 8;
		if (!inFull) {
			if (!isBack) return;
			if (root.CodeScreens.back()) {
				e.preventDefault();
				return;
			}
			if (current === 'inicio') return;
			e.preventDefault();
			show('inicio');
			tabFor('inicio').focus();
			return;
		}
		if (trackPanel.isOpen()) {
			if (isBack) {
				e.preventDefault();
				trackPanel.close();
			}
			return;
		}
		if (isBack) {
			e.preventDefault();
			if (chromeOn()) hideChrome();
			else leaveFull();
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
	show('inicio');
	placeStage(CP.snapshot());
	renderPill(null);

})(window);
