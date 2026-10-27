// Detecta mp4 con el índice (moov) después de los datos (mdat) y los remuxa con faststart, sin recodificar.
// La lectura de átomos usa peticiones Range, así que no descarga el archivo completo para decidir.
import { spawn } from 'node:child_process';

// Lee la cabecera del átomo que empieza en buf[0]. Devuelve null si faltan bytes.
export function parseAtomHeader(buf, remaining) {
	if (buf.length < 8) return null;
	let size = buf.readUInt32BE(0);
	const type = buf.toString('latin1', 4, 8);
	let headerLength = 8;
	if (size === 1) {
		if (buf.length < 16) return null;
		size = Number(buf.readBigUInt64BE(8));
		headerLength = 16;
	} else if (size === 0) {
		size = remaining;
	}
	return { type: type, size: size, headerLength: headerLength };
}

// Recorre los átomos de primer nivel. readRange(inicio, fin) devuelve un Buffer con esos bytes (inclusive).
export async function topLevelAtoms(readRange, fileSize) {
	const atoms = [];
	let offset = 0;
	while (offset + 8 <= fileSize) {
		const end = Math.min(offset + 16, fileSize) - 1;
		const header = parseAtomHeader(await readRange(offset, end), fileSize - offset);
		if (!header) break;
		atoms.push({ type: header.type, offset: offset });
		if (header.size < header.headerLength) break;
		offset += header.size;
	}
	return atoms;
}

// Verdadero si el índice (moov) aparece después de los datos (mdat), que es lo que impide reproducir en el TV.
export function needsFaststart(atoms) {
	const moov = atoms.find(function (a) { return a.type === 'moov'; });
	const mdat = atoms.find(function (a) { return a.type === 'mdat'; });
	return Boolean(moov && mdat && moov.offset > mdat.offset);
}

// Remuxa desde la URL de Drive a outPath con ffmpeg (-c copy, sin recodificar).
export function remuxFaststart({ inputUrl, authorization, outPath, spawnFn = spawn }) {
	return new Promise(function (resolve, reject) {
		const args = [
			'-v', 'error', '-y',
			'-headers', 'Authorization: ' + authorization + '\r\n',
			'-i', inputUrl,
			'-c', 'copy', '-movflags', '+faststart',
			'-f', 'mp4', outPath,
		];
		const child = spawnFn('ffmpeg', args);
		let stderr = '';
		child.stderr.on('data', function (chunk) { stderr += chunk; });
		child.on('error', reject);
		child.on('close', function (code) {
			if (code === 0) resolve();
			else reject(new Error('ffmpeg terminó con código ' + code + ': ' + stderr.trim()));
		});
	});
}
