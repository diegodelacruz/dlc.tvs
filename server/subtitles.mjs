// Subtítulos incrustados en el video: lista las pistas de texto y las convierte a WebVTT con ffmpeg.
// Las pistas de imagen (PGS, VobSub) no se convierten.
import { execFile } from 'node:child_process';
import { httpInputArgs, runFfmpeg } from './faststart.mjs';

const TEXT_CODECS = ['subrip', 'ass', 'ssa', 'webvtt', 'mov_text'];

// n es la posición entre todas las pistas de subtítulos (equivale a 0:s:n en ffmpeg).
export function textSubtitleTracks(probe) {
	const tracks = [];
	(probe.streams || []).forEach(function (stream, n) {
		if (TEXT_CODECS.indexOf(stream.codec_name) < 0) return;
		tracks.push({ n: n, codec: stream.codec_name, language: (stream.tags && stream.tags.language) || 'und' });
	});
	return tracks;
}

// Lee las pistas de subtítulos de la URL con ffprobe. Devuelve el JSON crudo.
export function probeSubtitles(inputUrl, authorization, execFn = execFile) {
	return new Promise(function (resolve, reject) {
		const args = [
			'-v', 'error', ...httpInputArgs(inputUrl, authorization),
			'-select_streams', 's',
			'-show_entries', 'stream=codec_name:stream_tags=language',
			'-of', 'json',
		];
		execFn('ffprobe', args, { maxBuffer: 1024 * 1024 }, function (err, stdout) {
			if (err) return reject(err);
			try {
				resolve(JSON.parse(stdout));
			} catch (e) {
				reject(e);
			}
		});
	});
}

// Convierte una pista de texto a WebVTT. Solo lee lo necesario para esa pista.
export function extractWebVtt(inputUrl, authorization, n, outPath, spawnFn) {
	return runFfmpeg(
		['-v', 'error', '-y', ...httpInputArgs(inputUrl, authorization), '-map', '0:s:' + n, '-c:s', 'webvtt', '-f', 'webvtt', outPath],
		spawnFn
	);
}
