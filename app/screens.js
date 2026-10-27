// Pantallas de la app: Inicio, Explorar, Video, Música, Fotos y Ajustes.
// Cada pantalla se dibuja al entrar. Atrás pasa primero por back(), que deshace un nivel dentro de la pantalla.
(function (root) {
	var SORT_LABEL = { name: 'Nombre', date: 'Fecha', size: 'Tamaño' };
	var SORT_ORDER = ['name', 'date', 'size'];
	var KIND_LABEL = { folder: 'Carpeta', video: 'Video', audio: 'Audio', image: 'Foto' };

	var explore = { stack: [] };
	var videoState = { list: [], detail: null };
	var photoState = { list: [] };
	var viewer = { open: false, list: [], index: 0, timer: null };

	function $(id) { return document.getElementById(id); }

	function clear(node) {
		while (node.firstChild) node.removeChild(node.firstChild);
	}

	function link(label, onPick) {
		var a = document.createElement('a');
		a.href = '#';
		a.textContent = label;
		a.onclick = function () { onPick(); return false; };
		return a;
	}

	function appendLine(parent, node) {
		parent.appendChild(node);
		parent.appendChild(document.createElement('br'));
	}

	function note(parent, msg) {
		var p = document.createElement('p');
		p.className = 'muted';
		p.textContent = msg;
		parent.appendChild(p);
	}

	function setStatus(id, msg) {
		$(id).textContent = msg || '';
	}

	function fail(id, e) {
		setStatus(id, 'Error: ' + (e && e.message ? e.message : String(e)));
	}

	function sizeText(bytes) {
		if (!bytes) return '';
		if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
		if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
		return Math.round(bytes / 1e3) + ' KB';
	}

	// Enfoca el primer enlace de un contenedor, si existe. Así el control remoto sigue donde corresponde.
	function focusFirst(id) {
		var a = $(id).querySelector('a');
		if (a) a.focus();
	}

	// Guarda el archivo en recientes (inicio de la lista, sin duplicados).
	function remember(file) {
		var list = root.CodeLogic.pushRecent(root.CodeStore.get('recent', []), { id: file.id, name: file.name, kind: file.kind }, 12);
		root.CodeStore.set('recent', list);
	}

	function favorites() {
		return root.CodeStore.get('favs', []);
	}

	function isFavorite(id) {
		return favorites().some(function (f) { return f.id === id; });
	}

	function toggleFavorite(folder) {
		var list = favorites();
		var exists = list.some(function (f) { return f.id === folder.id; });
		var next = exists ? list.filter(function (f) { return f.id !== folder.id; }) : list.concat([folder]);
		root.CodeStore.set('favs', next);
	}

	// ---------- Inicio ----------
	function renderHome() {
		var cont = $('home-continue');
		clear(cont);
		var inProgress = root.CodeLogic.continueList(root.CodeStore.get('progress', {}), 10);
		if (inProgress.length === 0) note(cont, 'Nada en curso. Empieza un video desde Video o Explorar.');
		inProgress.forEach(function (e) {
			appendLine(cont, link(e.name + ' · ' + root.CodeLogic.formatTime(e.time) + ' de ' + root.CodeLogic.formatTime(e.duration), function () {
				root.CodeShell.playVideo({ id: e.id, name: e.name, kind: 'video' }, e.time);
			}));
		});

		var rec = $('home-recent');
		clear(rec);
		var recent = root.CodeStore.get('recent', []);
		if (recent.length === 0) note(rec, 'Todavía no hay archivos recientes.');
		recent.forEach(function (f) {
			appendLine(rec, link('[' + (KIND_LABEL[f.kind] || 'Archivo') + '] ' + f.name, function () {
				openItem(f, [f], 0);
			}));
		});

		var favs = $('home-favs');
		clear(favs);
		var list = favorites();
		if (list.length === 0) note(favs, 'Sin favoritas. Márcalas desde Explorar.');
		list.forEach(function (folder) {
			appendLine(favs, link('[Carpeta] ' + folder.name, function () {
				root.CodeShell.show('explorar');
				explore.stack = [{ id: folder.id, name: folder.name }];
				renderExplore();
			}));
		});
	}

	// Abre un archivo según su tipo. siblings: lista de la que forma parte (para audio e imágenes).
	function openItem(item, siblings, index) {
		if (item.kind === 'video') {
			root.CodeShell.playVideo(item, 0);
		} else if (item.kind === 'audio') {
			var tracks = siblings.filter(function (s) { return s.kind === 'audio'; });
			var at = tracks.indexOf(item);
			if (at < 0) { tracks = [item]; at = 0; }
			root.CodeMusic.setQueue(tracks, at);
			root.CodeMusic.playAt(at);
			remember(item);
		} else if (item.kind === 'image') {
			var photos = siblings.filter(function (s) { return s.kind === 'image'; });
			var pos = photos.indexOf(item);
			openViewer(photos.length ? photos : [item], pos < 0 ? 0 : pos);
		}
	}

	// ---------- Explorar ----------
	function enterExplore() {
		if (explore.stack.length > 0) {
			renderExplore();
			return;
		}
		setStatus('explore-status', 'Cargando…');
		root.CodeDrive.rootFolder().then(function (id) {
			explore.stack = [{ id: id, name: root.CodeDrive.ROOT_NAME }];
			renderExplore();
		}).catch(function (e) { fail('explore-status', e); });
	}

	function renderExplore() {
		var top = explore.stack[explore.stack.length - 1];
		setStatus('explore-status', 'Cargando…');
		root.CodeDrive.children(top.id).then(function (items) {
			var mode = root.CodeStore.settings().sort;
			var sorted = root.CodeLogic.sortItems(items, mode);

			var crumbs = $('explore-path');
			clear(crumbs);
			explore.stack.forEach(function (c, i) {
				crumbs.appendChild(link(c.name, function () {
					explore.stack = explore.stack.slice(0, i + 1);
					renderExplore();
				}));
				if (i < explore.stack.length - 1) crumbs.appendChild(document.createTextNode(' › '));
			});

			var tools = $('explore-tools');
			clear(tools);
			tools.appendChild(link('Orden: ' + SORT_LABEL[mode], function () {
				var next = SORT_ORDER[(SORT_ORDER.indexOf(mode) + 1) % SORT_ORDER.length];
				root.CodeStore.saveSettings({ sort: next });
				renderExplore();
			}));
			tools.appendChild(document.createTextNode(' '));
			tools.appendChild(link(isFavorite(top.id) ? 'Quitar de favoritas' : 'Marcar como favorita', function () {
				toggleFavorite(top);
				renderExplore();
			}));

			var box = $('explore-list');
			clear(box);
			sorted.forEach(function (item) {
				if (item.kind === 'folder') {
					appendLine(box, link('[Carpeta] ' + item.name, function () {
						explore.stack.push({ id: item.id, name: item.name });
						renderExplore();
					}));
				} else {
					appendLine(box, link('[' + KIND_LABEL[item.kind] + '] ' + item.name + (item.size ? ' · ' + sizeText(item.size) : ''), function () {
						remember(item);
						openItem(item, sorted, sorted.indexOf(item));
					}));
				}
			});
			setStatus('explore-status', sorted.length ? '' : 'Carpeta vacía: no hay archivos compatibles.');
			if (root.CodeShell.current() === 'explorar') focusFirst('explore-list');
		}).catch(function (e) { fail('explore-status', e); });
	}

	// ---------- Video ----------
	function enterVideo() {
		if (videoState.detail) {
			showVideoDetail(videoState.detail);
			return;
		}
		showVideoList();
	}

	function showVideoList() {
		videoState.detail = null;
		$('video-detail').hidden = true;
		$('video-list').hidden = false;
		var list = $('video-list');
		clear(list);
		setStatus('video-status', 'Buscando videos en la biblioteca…');
		root.CodeDrive.crawl(['video']).then(function (items) {
			videoState.list = root.CodeLogic.sortItems(items, 'name');
			setStatus('video-status', videoState.list.length ? '' : 'No hay videos en la biblioteca.');
			videoState.list.forEach(function (item) {
				appendLine(list, link(item.name + (item.path.indexOf(' / ') >= 0 ? ' · ' + item.path : ''), function () {
					showVideoDetail(item);
				}));
			});
			if (root.CodeShell.current() === 'video') focusFirst('video-list');
		}).catch(function (e) { fail('video-status', e); });
	}

	function showVideoDetail(item) {
		videoState.detail = item;
		$('video-list').hidden = true;
		var detail = $('video-detail');
		detail.hidden = false;
		clear(detail);
		var title = document.createElement('h2');
		title.textContent = item.name;
		detail.appendChild(title);
		note(detail, 'Ubicación: ' + item.path + (item.size ? ' · ' + sizeText(item.size) : ''));
		detail.appendChild(link('Reproducir desde el inicio', function () {
			root.CodeShell.playVideo(item, 0);
		}));
		detail.appendChild(document.createTextNode(' '));
		var entry = root.CodeStore.get('progress', {})[item.id];
		if (root.CodeLogic.isInProgress(entry)) {
			detail.appendChild(link('Continuar desde ' + root.CodeLogic.formatTime(entry.time), function () {
				root.CodeShell.playVideo(item, entry.time);
			}));
			detail.appendChild(document.createTextNode(' '));
		}
		detail.appendChild(link('Volver a la lista', function () { showVideoList(); }));
		setStatus('video-status', '');
		focusFirst('video-detail');
	}

	// ---------- Música ----------
	function enterMusic() {
		var list = $('music-list');
		clear(list);
		setStatus('music-status', 'Buscando música en la biblioteca…');
		root.CodeDrive.crawl(['audio']).then(function (items) {
			var sorted = root.CodeLogic.sortItems(items, 'name');
			setStatus('music-status', sorted.length ? '' : 'No hay pistas de audio en la biblioteca.');
			sorted.forEach(function (item, i) {
				appendLine(list, link(item.name + (item.path.indexOf(' / ') >= 0 ? ' · ' + item.path : ''), function () {
					root.CodeMusic.setQueue(sorted, i);
					root.CodeMusic.playAt(i);
					remember(item);
				}));
			});
			if (root.CodeShell.current() === 'musica') focusFirst('music-list');
		}).catch(function (e) { fail('music-status', e); });
	}

	function renderNowPlaying(s) {
		var label = $('music-now-title');
		if (!s.item) {
			label.textContent = 'Nada reproduciéndose.';
		} else {
			label.textContent = (s.playing ? 'Reproduciendo: ' : 'En pausa: ') + s.item.name;
		}
		$('music-toggle').textContent = s.playing ? 'Pausa' : 'Reproducir';
		$('music-shuffle').textContent = 'Aleatorio: ' + (s.shuffle ? 'sí' : 'no');
		$('music-repeat').textContent = 'Repetir: ' + (s.repeat ? 'sí' : 'no');
	}

	// ---------- Fotos ----------
	function enterPhotos() {
		var grid = $('photo-grid');
		clear(grid);
		setStatus('photo-status', 'Buscando fotos en la biblioteca…');
		root.CodeDrive.crawl(['image']).then(function (items) {
			var sorted = root.CodeLogic.sortItems(items, 'name');
			photoState.list = sorted;
			setStatus('photo-status', sorted.length ? '' : 'No hay fotos en la biblioteca.');
			sorted.forEach(function (item, i) {
				var a = link(item.name, function () { openViewer(sorted, i); });
				a.className = 'photo';
				var img = document.createElement('img');
				img.alt = '';
				img.className = 'thumb';
				a.insertBefore(img, a.firstChild);
				a.insertBefore(document.createElement('br'), img.nextSibling);
				grid.appendChild(a);
				root.CodeDrive.urlFor(item).then(function (url) { img.src = url; });
			});
			if (root.CodeShell.current() === 'fotos') focusFirst('photo-grid');
		}).catch(function (e) { fail('photo-status', e); });
	}

	function openViewer(list, index) {
		viewer.open = true;
		viewer.list = list;
		viewer.index = index;
		$('viewer').hidden = false;
		$('viewer').setAttribute('data-modal', '');
		showViewerItem();
	}

	function showViewerItem() {
		var item = viewer.list[viewer.index];
		$('viewer-caption').textContent = (viewer.index + 1) + ' / ' + viewer.list.length + ' · ' + item.name +
			(viewer.timer ? ' · presentación activa' : '');
		root.CodeDrive.urlFor(item).then(function (url) {
			if (viewer.open && viewer.list[viewer.index] === item) $('viewer-img').src = url;
		});
	}

	function stepViewer(delta) {
		var n = viewer.list.length;
		viewer.index = (viewer.index + delta + n) % n;
		showViewerItem();
	}

	function stopSlideshow() {
		if (viewer.timer) clearInterval(viewer.timer);
		viewer.timer = null;
	}

	function toggleSlideshow() {
		if (viewer.timer) {
			stopSlideshow();
		} else {
			viewer.timer = setInterval(function () { stepViewer(1); }, root.CodeStore.settings().slideSeconds * 1000);
		}
		showViewerItem();
	}

	function closeViewer() {
		stopSlideshow();
		viewer.open = false;
		$('viewer').hidden = true;
		$('viewer').removeAttribute('data-modal');
		$('viewer-img').removeAttribute('src');
	}

	// Teclas del visor: izquierda/derecha cambian la foto y OK inicia o detiene la presentación.
	document.addEventListener('keydown', function (e) {
		if (!viewer.open) return;
		if (e.keyCode === 37) { e.preventDefault(); stepViewer(-1); }
		else if (e.keyCode === 39) { e.preventDefault(); stepViewer(1); }
		else if (e.keyCode === 13) { e.preventDefault(); toggleSlideshow(); }
	});

	// ---------- Ajustes ----------
	function renderSettings() {
		var s = root.CodeStore.settings();
		var slide = $('settings-slide');
		clear(slide);
		[5, 10, 30].forEach(function (sec) {
			slide.appendChild(link(sec + ' s' + (s.slideSeconds === sec ? ' (actual)' : ''), function () {
				root.CodeStore.saveSettings({ slideSeconds: sec });
				renderSettings();
			}));
			slide.appendChild(document.createTextNode(' '));
		});

		var sort = $('settings-sort');
		clear(sort);
		SORT_ORDER.forEach(function (mode) {
			sort.appendChild(link(SORT_LABEL[mode] + (s.sort === mode ? ' (actual)' : ''), function () {
				root.CodeStore.saveSettings({ sort: mode });
				renderSettings();
			}));
			sort.appendChild(document.createTextNode(' '));
		});

		var engine = $('engine-info');
		engine.textContent = 'Motor web: ' + navigator.userAgent;
		$('proxy-info').textContent = 'Reproducción: ' + (root.CodeDrive.hasProxy() ? 'con proxy (remux y subtítulos disponibles)' : 'sin proxy (solo reproducción directa)');
		$('library-info').textContent = 'Biblioteca: ' + root.CodeDrive.ROOT_NAME + ' (carpeta compartida con la cuenta de servicio).';

		var clearBox = $('settings-clear');
		clear(clearBox);
		clearBox.appendChild(link('Borrar historial de reproducción y recientes', function () {
			root.CodeStore.set('progress', {});
			root.CodeStore.set('recent', []);
			setStatus('settings-status', 'Historial borrado.');
		}));
	}

	// ---------- Entrada a cada sección y Atrás ----------
	function enter(name) {
		if (name === 'inicio') renderHome();
		else if (name === 'explorar') enterExplore();
		else if (name === 'video') enterVideo();
		else if (name === 'musica') enterMusic();
		else if (name === 'fotos') enterPhotos();
		else if (name === 'ajustes') renderSettings();
	}

	// Devuelve true si Atrás se consumió dentro de la pantalla (visor, detalle o carpeta anterior).
	function back() {
		if (viewer.open) {
			closeViewer();
			return true;
		}
		if (root.CodeShell.current() === 'video' && videoState.detail) {
			showVideoList();
			return true;
		}
		if (root.CodeShell.current() === 'explorar' && explore.stack.length > 1) {
			explore.stack.pop();
			renderExplore();
			return true;
		}
		return false;
	}

	// Música: el estado de reproducción se refleja en la sección Música.
	function initMusic() {
		root.CodeMusic.init($('music'));
		root.CodeMusic.setUrlFunction(function (item) { return root.CodeDrive.urlFor(item); });
		root.CodeMusic.subscribe(renderNowPlaying);
		$('music-prev').onclick = function () { root.CodeMusic.previous(); return false; };
		$('music-toggle').onclick = function () { root.CodeMusic.toggle(); return false; };
		$('music-next').onclick = function () { root.CodeMusic.next(); return false; };
		$('music-shuffle').onclick = function () { root.CodeMusic.setShuffle(!root.CodeMusic.snapshot().shuffle); return false; };
		$('music-repeat').onclick = function () { root.CodeMusic.setRepeat(!root.CodeMusic.snapshot().repeat); return false; };
	}

	root.CodeScreens = {
		init: function () {
			initMusic();
		},
		enter: enter,
		back: back,
		remember: remember,
		openItem: openItem,
		isViewerOpen: function () { return viewer.open; },
	};
})(window);
