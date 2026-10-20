# CodeTV

Aplicación para LG webOS TV que reproduce audio, imágenes y video desde Google Drive.

Estado actual: **Hito 0** completo y **Hitos 2 y 3** con código y pruebas simuladas. Falta probar con credenciales y en la TV.

## Estructura

```
app/                 Código de la app webOS (web empaquetada)
  appinfo.json       Metadatos de la app (id, versión, icono)
  index.html         Página principal (placeholder)
  icon.png           Icono pequeño
  largeIcon.png      Icono grande
docs/
  investigacion-webos.md   Hallazgos de plataforma, Developer Mode, Drive y distribución
  plan.md                  Plan por hitos
  pruebas.md               Matriz de pruebas por TV
```

## Requisitos de desarrollo

- Node.js 18 o superior (probado con v22.22.0).
- CLI de webOS: `@webos-tools/cli` (probado con 3.2.6).

Instalación de la CLI, sin agregarla al repositorio:

```bash
npm install --prefix ~/webos-cli @webos-tools/cli@3.2.6
export PATH="$HOME/webos-cli/node_modules/.bin:$PATH"
```

## Empaquetado

```bash
ares-package app -o dist
```

Genera `dist/com.diegodelacruz.codetv_<versión>_all.ipk`. La carpeta `dist/` está en `.gitignore`.

## Próximos pasos

Ver [docs/plan.md](docs/plan.md). Los hitos que dependen de credenciales (Google Cloud, cuenta LG, IP de las TV) se harán al final.

## Diseño de interfaz

Ver [docs/diseno-interfaz.md](docs/diseno-interfaz.md): referencias revisadas, principios, estructura de pantallas y criterios de foco.

## Prototipo

- [docs/prototipo/CodeTV.html](docs/prototipo/CodeTV.html): prototipo navegable (un solo archivo, sin conexión). Flechas = D-pad, Enter = OK, Escape/Backspace = Atrás.
- [docs/prototipo/captura-inicio.png](docs/prototipo/captura-inicio.png): captura de la pantalla de Inicio a 1920x1080.
- [docs/revision-prototipo.md](docs/revision-prototipo.md): resultados de la revisión con teclado y pendientes.
- [docs/factibilidad-mini-reproductor.md](docs/factibilidad-mini-reproductor.md): factibilidad del mini reproductor de video.

## Tokens (borrador)

- [app/src/styles/tokens.json](app/src/styles/tokens.json) y [app/src/styles/tokens.css](app/src/styles/tokens.css): colores de los cinco temas, tipografía, márgenes de seguridad y foco, derivados del prototipo. Son un borrador hasta que se aprueben los tokens oficiales.

## Pruebas

```bash
npm test
```

Usa el runner integrado de Node 22. Las pruebas de autenticación y Drive usan respuestas simuladas, no llaman a Google.

## Código

- `app/src/auth/deviceFlow.js`: flujo de dispositivo de Google (código, sondeo, renovación).
- `app/src/drive/driveClient.js`: listado de Drive y URL de contenido.
