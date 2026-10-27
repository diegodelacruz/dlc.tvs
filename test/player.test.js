import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const SOURCE = readFileSync(new URL('../app/player.js', import.meta.url), 'utf8');

function loadPlayer() {
	const sandbox = { window: {} };
	runInNewContext(SOURCE, sandbox);
	return sandbox.window.CodePlayer;
}

function fakeVideo() {
	const handlers = {};
	return {
		paused: true,
		currentTime: 0,
		src: '',
		addEventListener(name, fn) {
			(handlers[name] = handlers[name] || []).push(fn);
		},
		fire(name) {
			(handlers[name] || []).forEach(function (fn) { fn(); });
		},
		play() {
			this.paused = false;
			return Promise.resolve();
		},
		pause() {
			this.paused = true;
		},
	};
}

const FILE = { id: 'F1', name: 'pelicula.mp4' };

test('play abre en vista completa, llama al hook de inicio y pasa a reproduciendo', () => {
	const CP = loadPlayer();
	const video = fakeVideo();
	const started = [];
	CP.init(video);
	CP.onStart(function (file) { started.push(file.id); });
	CP.play(FILE, 'http://x/stream/F1');
	assert.equal(CP.snapshot().mode, 'full');
	assert.deepEqual(started, ['F1']);
	video.fire('playing');
	assert.equal(CP.snapshot().state, 'playing');
});

test('pausa guarda la posición y al volver a abrir el archivo se reanuda desde ahí', () => {
	const CP = loadPlayer();
	const video = fakeVideo();
	CP.init(video);
	CP.play(FILE, 'http://x/stream/F1');
	video.fire('playing');
	video.currentTime = 95;
	video.pause();
	video.fire('pause');
	assert.equal(CP.snapshot().state, 'paused');

	CP.close();
	CP.play(FILE, 'http://x/stream/F1');
	video.fire('loadedmetadata');
	assert.equal(video.currentTime, 95);
});

test('al terminar queda en terminado y el siguiente toggle empieza desde el inicio', () => {
	const CP = loadPlayer();
	const video = fakeVideo();
	CP.init(video);
	CP.play(FILE, 'http://x/stream/F1');
	video.fire('playing');
	video.currentTime = 120;
	video.pause();
	video.fire('pause');
	video.fire('ended');
	assert.equal(CP.snapshot().state, 'ended');
	CP.toggle();
	assert.equal(video.currentTime, 0);
	assert.equal(video.paused, false);
});

test('cerrar oculta el mini, detiene el video y conserva la posición', () => {
	const CP = loadPlayer();
	const video = fakeVideo();
	CP.init(video);
	CP.play(FILE, 'http://x/stream/F1');
	video.fire('playing');
	video.currentTime = 40;
	CP.close();
	assert.equal(CP.snapshot().file, null);
	assert.equal(CP.snapshot().state, 'idle');
	assert.equal(video.paused, true);
	CP.play(FILE, 'http://x/stream/F1');
	video.fire('loadedmetadata');
	assert.equal(video.currentTime, 40);
});

test('cambiar de modo no reemplaza el elemento de video', () => {
	const CP = loadPlayer();
	const video = fakeVideo();
	CP.init(video);
	CP.play(FILE, 'http://x/stream/F1');
	CP.setMode('mini');
	CP.setMode('full');
	assert.equal(CP.snapshot().mode, 'full');
	assert.equal(video.src, 'http://x/stream/F1');
});
