// Selector de audio y subtítulos para la vista completa. Estado en el propio <video>.
// Subtítulos: el proxy lista las pistas de texto (/subs/<id>) y las sirve como WebVTT.
(function (root) {
	function clear(node) {
		while (node.firstChild) node.removeChild(node.firstChild);
	}

	function option(onPick) {
		var a = document.createElement('a');
		a.href = '#';
		a.onclick = function () { onPick(); return false; };
		return a;
	}

	// Crea el panel dentro de container. opts: { onOpen(), onClose() } para que la pantalla ajuste la navegación.
	function mount(container, video, opts) {
		var panel = document.createElement('div');
		panel.id = 'tracks-panel';
		panel.className = 'tracks-panel';
		panel.setAttribute('data-modal', '');
		panel.hidden = true;
		panel.innerHTML = '<h2>Audio</h2><div class="audio-options"></div>' +
			'<h2>Subtítulos</h2><div class="sub-options"></div>' +
			'<p><a href="#" class="tracks-close">Cerrar</a></p>';
		container.appendChild(panel);
		var audioBox = panel.querySelector('.audio-options');
		var subBox = panel.querySelector('.sub-options');
		var audioLinks = [];
		var subLinks = [];
		var opener = null;
		var onOpen = (opts && opts.onOpen) || function () {};
		var onClose = (opts && opts.onClose) || function () {};

		function refresh() {
			var audio = video.audioTracks;
			audioLinks.forEach(function (a, i) {
				a.textContent = 'Pista ' + i + ': ' + (audio[i].language || 'sin dato') + (audio[i].enabled ? ' (activa)' : '');
			});
			var texts = video.textTracks;
			var anyShowing = false;
			subLinks.forEach(function (a, i) {
				if (i === texts.length) return;
				var on = texts[i].mode === 'showing';
				if (on) anyShowing = true;
				a.textContent = 'Pista ' + i + ': ' + (texts[i].language || 'sin dato') + (on ? ' (activa)' : '');
			});
			if (subLinks.length > 0) {
				subLinks[subLinks.length - 1].textContent = 'Desactivado' + (anyShowing ? '' : ' (activo)');
			}
		}

		function open(from) {
			opener = from;
			clear(audioBox);
			clear(subBox);
			audioLinks = [];
			subLinks = [];
			var audio = video.audioTracks;
			if (audio) {
				for (var i = 0; i < audio.length; i++) {
					(function (index) {
						var a = option(function () {
							for (var j = 0; j < audio.length; j++) audio[j].enabled = (j === index);
							refresh();
						});
						audioLinks.push(a);
						audioBox.appendChild(a);
					})(i);
				}
			} else {
				audioBox.textContent = 'Este video no permite elegir audio.';
			}
			var texts = video.textTracks;
			for (var k = 0; k < texts.length; k++) {
				(function (index) {
					var a = option(function () {
						for (var j = 0; j < texts.length; j++) texts[j].mode = (j === index) ? 'showing' : 'disabled';
						refresh();
					});
					subLinks.push(a);
					subBox.appendChild(a);
				})(k);
			}
			var off = option(function () {
				for (var j = 0; j < texts.length; j++) texts[j].mode = 'disabled';
				refresh();
			});
			subLinks.push(off);
			subBox.appendChild(off);
			refresh();
			panel.hidden = false;
			onOpen();
			var first = audioLinks.concat(subLinks).filter(function (a) {
				return a.textContent.indexOf('(activa)') >= 0 || a.textContent.indexOf('(activo)') >= 0;
			})[0];
			(first || audioLinks[0] || subLinks[0]).focus();
		}

		function close() {
			if (panel.hidden) return;
			panel.hidden = true;
			onClose();
			if (opener) opener.focus();
		}

		panel.querySelector('.tracks-close').onclick = function () { close(); return false; };

		return {
			open: open,
			close: close,
			isOpen: function () { return !panel.hidden; },
			element: panel,
		};
	}

	// Agrega un <track> por cada pista de texto que el proxy reporte para el video.
	// streamUrl es la URL de /stream/<id>?s=...; las pistas se piden a /subs/<id>.
	function loadSubtitles(video, streamUrl, onInfo) {
		var old = video.getElementsByTagName('track');
		while (old.length) video.removeChild(old[0]);
		var parts = streamUrl.split('?');
		if (parts[0].indexOf('/stream/') < 0) {
			if (onInfo) onInfo('Sin subtítulos: la URL no pasa por el proxy.');
			return Promise.resolve([]);
		}
		var base = parts[0].replace('/stream/', '/subs/');
		var query = parts[1];
		return fetch(base + '?' + query).then(function (res) {
			if (!res.ok) throw new Error('código ' + res.status);
			return res.json();
		}).then(function (tracks) {
			tracks.forEach(function (t) {
				var track = document.createElement('track');
				track.kind = 'subtitles';
				track.label = t.language;
				track.srclang = t.language;
				track.crossOrigin = 'anonymous';
				track.src = base + '/' + t.n + '.vtt?' + query;
				video.appendChild(track);
			});
			return tracks;
		}).catch(function (e) {
			if (onInfo) onInfo('Subtítulos no disponibles: ' + e.message);
			return [];
		});
	}

	root.CodeTracks = { mount: mount, loadSubtitles: loadSubtitles };
})(window);
