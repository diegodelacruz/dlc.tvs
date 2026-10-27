import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const SOURCE = readFileSync(new URL('../app/logic.js', import.meta.url), 'utf8');
// Los arreglos creados en el contexto aislado tienen otro prototipo; se normalizan antes de comparar.
const plain = (v) => JSON.parse(JSON.stringify(v));
const L = (function () {
	const sandbox = { window: {} };
	runInNewContext(SOURCE, sandbox);
	return sandbox.window.CodeLogic;
})();

test('sortItems pone carpetas primero y ordena por nombre, fecha o tamaño', () => {
	const items = [
		{ name: 'b.mkv', kind: 'video', size: 10, modifiedTime: '2026-01-02' },
		{ name: 'Serie', kind: 'folder', size: 0, modifiedTime: '2025-01-01' },
		{ name: 'a.mp3', kind: 'audio', size: 99, modifiedTime: '2026-03-01' },
	];
	assert.deepEqual(L.sortItems(items, 'name').map(i => i.name), ['Serie', 'a.mp3', 'b.mkv']);
	assert.deepEqual(L.sortItems(items, 'date').map(i => i.name), ['Serie', 'a.mp3', 'b.mkv']);
	assert.deepEqual(L.sortItems(items, 'size').map(i => i.name), ['Serie', 'a.mp3', 'b.mkv']);
	assert.equal(items[0].name, 'b.mkv', 'no modifica el arreglo original');
});

test('formatTime muestra m:ss y h:mm:ss', () => {
	assert.equal(L.formatTime(0), '0:00');
	assert.equal(L.formatTime(65.9), '1:05');
	assert.equal(L.formatTime(3725), '1:02:05');
	assert.equal(L.formatTime(-3), '0:00');
});

test('continueList solo incluye entradas en curso y ordena por actualización', () => {
	const progress = {
		A: { name: 'a', time: 100, duration: 1000, updated: 1 },
		B: { name: 'b', time: 500, duration: 1000, updated: 5 },
		C: { name: 'c', time: 990, duration: 1000, updated: 9 },
		D: { name: 'd', time: 2, duration: 1000, updated: 8 },
	};
	assert.deepEqual(plain(L.continueList(progress, 10).map(e => e.id)), ['B', 'A']);
});

test('pushRecent quita duplicados, pone el nuevo primero y limita el tamaño', () => {
	let list = [{ id: 'x' }, { id: 'y' }];
	list = L.pushRecent(list, { id: 'y' }, 2);
	assert.deepEqual(list.map(i => i.id), ['y', 'x']);
	list = L.pushRecent(list, { id: 'z' }, 2);
	assert.deepEqual(list.map(i => i.id), ['z', 'y']);
});

test('playOrder en orden normal y mezclado con generador fijo', () => {
	assert.deepEqual(plain(L.playOrder(4, false)), [0, 1, 2, 3]);
	const mixed = L.playOrder(4, true, () => 0);
	assert.deepEqual(plain(mixed).sort(), [0, 1, 2, 3]);
});

test('nextPosition respeta repetir y el final de la lista', () => {
	assert.equal(L.nextPosition(0, 3, false), 1);
	assert.equal(L.nextPosition(2, 3, false), -1);
	assert.equal(L.nextPosition(2, 3, true), 0);
	assert.equal(L.nextPosition(0, 0, true), -1);
	assert.equal(L.previousPosition(0), 0);
	assert.equal(L.previousPosition(3), 2);
});

test('clampTime mantiene el tiempo dentro del archivo', () => {
	assert.equal(L.clampTime(-5, 100), 0);
	assert.equal(L.clampTime(150, 100), 100);
	assert.equal(L.clampTime(42, 100), 42);
});
