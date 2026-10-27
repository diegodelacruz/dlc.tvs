// Navegación con control remoto para las páginas de la app.
// Flechas arriba/izquierda y abajo/derecha mueven el foco entre enlaces; OK (13) activa el enlace enfocado.
// Al hacer clic con el puntero, el enlace pierde el foco para que no quede marcado.
(function () {
	var current = -1;

	function links() {
		return Array.prototype.slice.call(document.querySelectorAll('a[href]'));
	}

	function focusAt(index) {
		var list = links();
		if (list.length === 0) return;
		current = (index + list.length) % list.length;
		list[current].focus();
	}

	document.addEventListener('keydown', function (e) {
		var code = e.keyCode;
		if (code === 40 || code === 39) {
			e.preventDefault();
			focusAt(current < 0 ? 0 : current + 1);
		} else if (code === 38 || code === 37) {
			e.preventDefault();
			focusAt(current < 0 ? 0 : current - 1);
		} else if (code === 13) {
			var el = document.activeElement;
			if (el && el.tagName === 'A') {
				e.preventDefault();
				el.click();
			}
		}
	});

	document.addEventListener('focusin', function (e) {
		var index = links().indexOf(e.target);
		if (index >= 0) current = index;
	});

	document.addEventListener('click', function (e) {
		var target = e.target;
		while (target && target.tagName !== 'A') target = target.parentNode;
		if (target) {
			setTimeout(function () { target.blur(); }, 0);
		}
	});

	window.addEventListener('load', function () { focusAt(0); });
})();
