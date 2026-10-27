// Esqueleto de la app: barra superior con secciones y contenido por sección.
// - OK sobre una sección de la barra la abre (no cambia con solo mover el foco).
// - Atrás fuera de Inicio vuelve a Inicio. En Inicio no se intercepta: el sistema decide.
(function () {
	var SECTIONS = ['inicio', 'explorar', 'video', 'musica', 'fotos', 'ajustes'];
	var current = 'inicio';

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
	}

	SECTIONS.forEach(function (name) {
		tabFor(name).onclick = function () {
			show(name);
			return false;
		};
	});

	document.addEventListener('keydown', function (e) {
		if (e.keyCode !== 461 && e.keyCode !== 27 && e.keyCode !== 8) return;
		if (current === 'inicio') return;
		e.preventDefault();
		show('inicio');
		tabFor('inicio').focus();
	});

	var engine = document.getElementById('engine-info');
	if (engine) engine.textContent = 'Motor web: ' + navigator.userAgent;
})();
