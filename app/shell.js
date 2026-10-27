// Shell de la app: barra superior, reproductor (mini y vista completa), controles y reglas de Atrás.
// - OK sobre una sección de la barra la abre. Mover el foco no cambia de sección.
// - El <video> vive siempre dentro de #stage. Mini y vista completa solo cambian su posición y tamaño.
// - Atrás: primero lo consume la pantalla (CodeScreens.back), luego la vista completa, y por último vuelve a Inicio.
//   En Inicio no se intercepta: el sistema decide.
(function (root) {
	var SECTIONS = ['inicio', 'explorar', 'video', 'musica', 'fotos', 'ajustes'];
	var CP = root.CodePlayer;
	var CONTROLS_MS = 4000;
	var SKIP_S = 10;
	var current = 'inicio';
	var inFull = false;
	var controlsTimer = null;

	var stage = document.getElementById('stage');
	var slot = document.getElementById('mini-slot');
	var player = document.getElementById('player');
	var mini = document.getElementById('mini');
	var miniState = document.getElementById('mini-state');
	var miniFull = document.getElementById('mini-full');
	var miniToggle = document.getElementById('mini-toggle');
	var miniClose = document.getElementById('mini-close');
	var fullControls = document.getElementById('full-controls');
	var fullTime = document.getElementById('full-time');
	var fullToggle = document.getElementById('full-toggle');

	var STATE_TEXT = { playing: 'Reproduciendo', paused: 'En pausa', ended: 'Terminado', idle: '' };

	function tabFor(name) {
		return document.querySelector('#tabs a[data-section="' + name + '"]');
	}

	function show(name) {
		if (SECTIONS.indexOf(name) < 0) return;
		current = name;
		SECTIONS.forEach(function (s) {
			document.getElementById('sec-' + s).hidden = (s !== name);
			var tab = tabFor(s);
			if (s === name) {
				tab.className = 'current';
				tab.setAttribute('aria-current', 'page');
			} else {
				tab.className = '';
				tab.removeAttribute('aria-current');
			}
		});
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

	function controlsVisible() {
		return !fullControls.hidden;
	}

	// Muestra los controles con el foco en Pausa, para que OK tenga a qué aplicarse.
	function showControls() {
		fullControls.hidden = false;
		updateFullTime();
		fullToggle.focus();
		armHideTimer();
	}

	function hideControls() {
		clearTimeout(controlsTimer);
		controlsTimer = null;
		fullControls.hidden = true;
		if (document.activeElement && fullControls.contains(document.activeElement)) document.activeElement.blur();
	}

	function armHideTimer() {
		clearTimeout(controlsTimer);
		controlsTimer = setTimeout(function () {
			if (!trackPanel.isOpen()) hideControls();
		}, CONTROLS_MS);
	}

	function updateFullTime() {
		var st = CP.status();
		fullTime.textContent = root.CodeLogic.formatTime(st.time) + ' / ' + root.CodeLogic.formatTime(st.duration);
		fullToggle.textContent = player.paused ? 'Reproducir' : 'Pausa';
	}

	// Selector de audio y subtítulos. Mientras está abierto, la navegación queda dentro de él.
	var trackPanel = root.CodeTracks.mount(stage, player, {
		onOpen: function () {
			stage.removeAttribute('data-modal');
			clearTimeout(controlsTimer);
		},
		onClose: function () {
			if (inFull) stage.setAttribute('data-modal', '');
			armHideTimer();
		},
	});

	function render(s) {
		inFull = s.file !== null && s.mode === 'full';
		player.controls = false;
		if (inFull) {
			stage.setAttribute('data-modal', '');
		} else {
			stage.removeAttribute('data-modal');
			hideControls();
			if (trackPanel.isOpen()) trackPanel.close();
		}
		placeStage(s);
		mini.className = (s.file && !inFull) ? 'show' : '';
		if (s.file) {
			miniState.textContent = s.file.name + ' · ' + STATE_TEXT[s.state];
			miniToggle.textContent = s.state === 'playing' ? 'Pausa' : (s.state === 'ended' ? 'Reiniciar' : 'Reproducir');
		}
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
		hideControls();
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

	SECTIONS.forEach(function (name) {
		tabFor(name).onclick = function () {
			show(name);
			return false;
		};
	});

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

	document.getElementById('full-back').onclick = function () { CP.seekBy(-SKIP_S); updateFullTime(); armHideTimer(); return false; };
	fullToggle.onclick = function () { CP.toggle(); updateFullTime(); armHideTimer(); return false; };
	document.getElementById('full-fwd').onclick = function () { CP.seekBy(SKIP_S); updateFullTime(); armHideTimer(); return false; };
	document.getElementById('full-tracks').onclick = function () {
		trackPanel.open(this);
		return false;
	};

	player.addEventListener('timeupdate', function () {
		if (controlsVisible()) updateFullTime();
	});

	window.addEventListener('popstate', function () {
		if (CP.snapshot().mode === 'full') {
			hideControls();
			CP.setMode('mini');
			miniFull.focus();
		}
	});

	window.addEventListener('resize', function () { placeStage(CP.snapshot()); });

	// Teclas en vista completa. Con los controles ocultos, izquierda/derecha saltan y OK pausa.
	// Con los controles visibles, la navegación la hace nav.js.
	function fullKey(e) {
		var code = e.keyCode;
		if (trackPanel.isOpen()) {
			if (code === 461 || code === 27 || code === 8) {
				e.preventDefault();
				trackPanel.close();
			}
			return;
		}
		if (code === 461 || code === 27 || code === 8) {
			e.preventDefault();
			if (controlsVisible()) hideControls();
			else leaveFull();
			return;
		}
		if (!controlsVisible()) {
			if (code === 37) { e.preventDefault(); CP.seekBy(-SKIP_S); showControls(); }
			else if (code === 39) { e.preventDefault(); CP.seekBy(SKIP_S); showControls(); }
			else if (code === 38 || code === 40) { e.preventDefault(); showControls(); fullToggle.focus(); }
			else if (code === 13) { e.preventDefault(); CP.toggle(); }
			return;
		}
		armHideTimer();
	}

	document.addEventListener('keydown', function (e) {
		if (inFull) {
			fullKey(e);
			return;
		}
		if (e.keyCode !== 461 && e.keyCode !== 27 && e.keyCode !== 8) return;
		if (root.CodeScreens.back()) {
			e.preventDefault();
			return;
		}
		if (current === 'inicio') return;
		e.preventDefault();
		show('inicio');
		tabFor('inicio').focus();
	});

	var engine = document.getElementById('engine-info');
	if (engine) engine.textContent = 'Motor web: ' + navigator.userAgent;

	root.CodeScreens.init();
	show('inicio');
	placeStage(CP.snapshot());

	root.CodeShell = {
		show: show,
		current: function () { return current; },
		playVideo: playVideo,
		goFull: goFull,
	};
})(window);
