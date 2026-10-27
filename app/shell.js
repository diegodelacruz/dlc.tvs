// Esqueleto de la app: barra superior con secciones, reproductor en la barra y navegación.
// - OK sobre una sección de la barra la abre (no cambia con solo mover el foco).
// - El <video> vive siempre dentro de #stage. Mini y vista completa solo cambian su posición y tamaño.
// - Atrás en vista completa vuelve al mini. Atrás fuera de Inicio vuelve a Inicio.
//   En Inicio no se intercepta: el sistema decide.
(function () {
	var SECTIONS = ['inicio', 'explorar', 'video', 'musica', 'fotos', 'ajustes'];
	var CP = window.CodePlayer;
	var current = 'inicio';
	var inFull = false;
	var videosLoaded = false;
	var prepared = null;

	var stage = document.getElementById('stage');
	var slot = document.getElementById('mini-slot');
	var player = document.getElementById('player');
	var mini = document.getElementById('mini');
	var miniState = document.getElementById('mini-state');
	var miniFull = document.getElementById('mini-full');
	var miniToggle = document.getElementById('mini-toggle');
	var miniClose = document.getElementById('mini-close');
	var videoList = document.getElementById('video-list');

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
		if (name === 'video') loadVideos();
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

	function render(s) {
		inFull = s.file !== null && s.mode === 'full';
		player.controls = inFull;
		// Con vista completa, la navegación de la app queda detrás: el foco solo vive en el reproductor.
		if (inFull) stage.setAttribute('data-modal', '');
		else stage.removeAttribute('data-modal');
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
			CP.setMode('full');
			history.pushState({ full: true }, '');
		}
	}

	// Sale de vista completa. Solo usa el historial si la entrada la creó la app; si no, cambia el modo.
	function leaveFull() {
		if (history.state && history.state.full) history.back();
		else CP.setMode('mini');
	}

	function startPlayback(file, url) {
		var wasFull = inFull;
		CP.play(file, url);
		if (!wasFull) history.pushState({ full: true }, '');
	}

	function loadVideos() {
		if (videosLoaded) return;
		if (!window.CodeTV) {
			videoList.textContent = 'La biblioteca no está cargada (ejecuta npm run package:tv).';
			return;
		}
		videosLoaded = true;
		videoList.textContent = 'Cargando…';
		window.CodeTV.prepareVideos('CodeTV-prueba').then(function (p) {
			prepared = p;
			videoList.textContent = '';
			p.videos.filter(function (f) { return f.kind !== 'image'; }).forEach(function (file) {
				var link = document.createElement('a');
				link.href = '#';
				link.textContent = file.name;
				link.onclick = function () {
					startPlayback(file, prepared.url(file));
					return false;
				};
				videoList.appendChild(link);
				videoList.appendChild(document.createElement('br'));
			});
		}).catch(function (e) {
			videosLoaded = false;
			videoList.textContent = 'Error al cargar la lista: ' + (e && e.message ? e.message : String(e));
		});
	}

	SECTIONS.forEach(function (name) {
		tabFor(name).onclick = function () {
			show(name);
			return false;
		};
	});

	CP.init(player);
	CP.subscribe(render);
	CP.onStart(function () { /* Aquí se pausará la música cuando exista la sección de música. */ });

	miniFull.onclick = function () { goFull(); return false; };
	miniToggle.onclick = function () { CP.toggle(); return false; };
	miniClose.onclick = function () {
		CP.close();
		tabFor(current).focus();
		return false;
	};

	window.addEventListener('popstate', function () {
		if (CP.snapshot().mode === 'full') {
			CP.setMode('mini');
			miniFull.focus();
		}
	});

	window.addEventListener('resize', function () { placeStage(CP.snapshot()); });

	document.addEventListener('keydown', function (e) {
		if (e.keyCode !== 461 && e.keyCode !== 27 && e.keyCode !== 8) return;
		if (inFull) {
			e.preventDefault();
			leaveFull();
			return;
		}
		if (current === 'inicio') return;
		e.preventDefault();
		show('inicio');
		tabFor('inicio').focus();
	});

	var engine = document.getElementById('engine-info');
	if (engine) engine.textContent = 'Motor web: ' + navigator.userAgent;
	placeStage(CP.snapshot());
})();
