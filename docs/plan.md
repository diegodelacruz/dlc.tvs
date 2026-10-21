# Plan: App webOS (LG TV) para reproducir multimedia desde Google Drive

## Context

Diego quiere una aplicación para dos TV LG con webOS (una de 2020 y otra de 2023) para reproducir contenido multimedia desde Google Drive. Uso inicial personal; distribución posible en el futuro. Otros proveedores (Dropbox, OneDrive, etc.) quedan para después. El repositorio `diegodelacruz/dlc.tvs` está vacío (solo `.git`), así que se parte de cero.

Diego pidió: investigar primero todo lo que se pueda hacer sin él; dejar para el final lo que dependa de sus credenciales o configuraciones; y luego probar. Este documento es solo el plan. No se han hecho cambios.

## Hallazgos de la investigación

**Plataforma y herramientas**
- La CLI oficial vigente es `@webos-tools/cli` (v3.x), que sirve para webOS OSE y webOS TV cambiando el perfil. La CLI anterior de TV (`ares` antigua) quedó descontinuada desde marzo de 2024. Comandos clave: `ares-generate`, `ares-package`, `ares-install`, `ares-launch`, `ares-inspect`. [Fuente: webostv.developer.lge.com CLI intro; yarnpkg `@webos-tools/cli`]
- Motor web por versión (documentación de LG, vía búsqueda):
  - webOS TV 24: Chromium 108
  - webOS TV 23: Chromium 94
  - webOS TV 22: Chromium 87
  - Un TV conserva el motor con el que salió. [No verificado para webOS 5/6, que corresponden a los modelos de 2020 y 2021; el motor de webOS 5 probablemente es mucho más antiguo. Hay que confirmarlo en la TV.]
- Inspección remota con Chrome DevTools: documentada por LG (App Debugging) y en webosbrew.org.

**Modo desarrollador**
- Se activa con la app "Developer Mode" de la LG Content Store, con cuenta LG.
- La sesión caduca. Las cifras encontradas se contradicen: 50 h (reportes de 2022) frente a 999 h (foro oficial, más reciente). Además, la sesión se pierde si la TV se reinicia sin red, o si la cuenta entra en otra TV. [No verificado: el límite vigente hay que leerlo en la propia app en cada TV.]
- Al caducar, la app instalada en modo desarrollador se elimina. Esto es una limitación importante para uso personal continuo.

**Reproducción de video**
- Hay soporte documentado de terceros para DASH y HLS en webOS, con codecs AVC, HEVC y AV1 según el modelo. [Fuente: Radiant Media Player, Nagra. No es documentación oficial de LG.]
- No se encontró documentación oficial de LG sobre la pila de medios. Hay que probar directamente en cada TV con archivos de prueba.

**Google Drive**
- `files.get` con `alt=media` descarga el contenido de archivos binarios (mp4, mkv, etc.). Los Google Docs/Sheets/Slides necesitan `files.export`, pero no son video.
- Soporte de `Range` en `alt=media` para hacer seek: no confirmado para Drive. Es un punto crítico. Si no hay rangos, el seek será inviable y habrá que usar otra estrategia (proxy propio o transcodificación).
- OAuth para TV y dispositivos de entrada limitada (device flow): documentación de Google, con endpoint `https://oauth2.googleapis.com/device/code`. El ejemplo oficial usa YouTube, no Drive. **No se confirmó que los scopes de Drive estén permitidos en este flujo.** Es un riesgo que hay que validar primero.
- Scopes de Drive (`drive.readonly`) son restringidos: para distribución pública requieren verificación de Google. En modo de prueba, los refresh tokens de apps no verificadas caducan a los 7 días. [Inferencial: verificar en la consola de Google.]

**Distribución y aprobación**
- Tienda oficial: LG Seller Lounge → QA de LG → LG Content Store. Requiere documentos (UX scenario, self checklist). [Fuente: LG App Approval Process.]
- Costos, requisitos fiscales y tiempos actuales de vendedor individual: **no verificados**.

## Enfoque recomendado

**App web empaquetada (HTML/CSS/JS) para webOS**, no nativa.
- Motivo: es el formato oficial de LG, se empaqueta con `ares-package` y se instala con `ares-install`. El modelo de Drive es web (fetch + OAuth), y la pila de video se puede usar con `<video>` nativo.
- Framework a decidir: JS plano (menor riesgo con motores viejos) o Enact (framework de LG basado en React, con soporte de control remoto). **Decisión pendiente de Diego** (ver preguntas).
- Sintaxis: apuntar a la versión más antigua de motor que se quiera soportar. Transpilar con Babel/Vite a ES2017–ES2019 si el TV de 2020 lo requiere.

## Arquitectura propuesta (alto nivel)

```
[Control remoto LG]
      |
[App webOS (web)]
   |-- Auth: OAuth device flow (Google) -> refresh token guardado localmente
   |-- Drive client: listar carpetas y archivos de video (files.list con q=mimeType video/)
   |-- Player: <video> nativo con URL de descarga autenticada (o proxy si Range falla)
   |-- Navegación con control remoto (teclas de webOS / Enact)
```

Puntos abiertos de arquitectura:
- Si `alt=media` no soporta `Range`, decidir entre: (a) proxy propio en un servidor, (b) reproducción completa (sin seek), (c) otro formato.
- Persistencia: `localStorage` del TV alcanza para el refresh token en uso personal; evaluar si se necesita algo más.

## Ruta de desarrollo por hitos

Estado al 2026-10-21. Leyenda: `[x]` completado · `[~]` parcial (código o documentación sin verificar en TV o con credenciales) · `[ ]` pendiente.

**Hito 0 — Verificaciones técnicas sin credenciales — completo**
- [x] Estructura del proyecto: `README.md`, `docs/`, `app/`, `src/`, `test/`.
- [x] Hallazgos de la investigación documentados con fuentes en `docs/investigacion-webos.md`.
- [x] CLI `@webos-tools/cli` 3.2.6 instalada y comandos `ares-*` verificados.
- [x] App de prueba generada con `ares-generate` y empaquetada en `.ipk` con `ares-package`.
- [x] Matriz de pruebas por TV en `docs/pruebas.md`.

**Hito 1 — Decisiones de diseño — parcial**
- [x] Modo de uso inicial: personal.
- [x] Formatos a soportar: audio, imágenes, video mp4, mkv y HEVC.
- [~] Framework: JavaScript plano adoptado de forma provisional. Falta tu confirmación.
- [ ] Proyecto en Google Cloud: pendiente (Hito 4).

**Hito 2 — Autenticación con Google — parcial (código y pruebas simuladas)**
- [x] Flujo de dispositivo: solicitud de código, sondeo, `slow_down`, errores y expiración en `src/auth/deviceFlow.js`.
- [x] Renovación de token con conservación del refresh token y `invalid_grant` (volver a autorizar).
- [ ] Validar que Google permite los scopes de Drive en el flujo de dispositivo. Requiere credenciales (Hito 4).
- [ ] Pantalla con código y URL de verificación en la TV. Depende del Hito 5.

**Hito 3 — Cliente de Drive y reproductor — parcial**
- [x] Listado paginado de carpetas y medios, con clasificación por MIME (`src/drive/driveClient.js`).
- [x] Pruebas unitarias del cliente con respuestas simuladas.
- [ ] Reproductor `<video>` dentro de la app con URL autenticada. No construido.
- [ ] Verificar `Range` en `alt=media` con una petición real. Requiere credenciales (Hito 4).

**Hito 4 — Credenciales y configuración (lo haces tú) — pendiente**
- [x] Modelos, firmware y versión de webOS de las dos TV, leídos en pantalla.
- [ ] Cuenta de desarrollador LG. No encontré correos de LG Developer en tu Gmail; verifícala tú.
- [ ] Modo desarrollador en ambas TV, con IP de cada TV.
- [ ] Proyecto en Google Cloud, API de Drive y cliente OAuth "TV and Limited Input devices".
- [ ] Cuenta de Google con archivos de prueba (mp4, mkv, HEVC).

**Hito 5 — Despliegue y pruebas en TV — no iniciado**
- [ ] Perfil de la CLI para cada TV (`ares-setup-device`).
- [ ] `ares-package` + `ares-install` + `ares-launch` en la TV 2019 (OLED55B9PSB, webOS 4.10.2) y en la TV 2021 (OLED48A1PSA, webOS 6.5.3).
- [ ] Pruebas de login, listado, reproducción, seek, pausa, reanudación, pérdida de red y expiración de Developer Mode.
- [ ] Pruebas con el Magic Remote físico: puntero, foco y rueda (ver `docs/pruebas.md`).
- [ ] Validar el video real en el mini reproductor.
- [ ] Registrar resultados por TV en `docs/pruebas.md`.

**Hito 6 — Hardening y futuro — no iniciado**
- [ ] Manejo de errores y logs de depuración.
- [ ] Abstracción de "fuente de contenido" para otros proveedores.
- [ ] Evaluar requisitos de LG Content Store solo si se decide distribuir.

**Trabajo fuera del plan original (completado)**
- [x] Diseño de interfaz: propuesta en `docs/diseno-interfaz.md`, prototipo navegable en `docs/prototipo/CodeTV.html` y revisión en `docs/revision-prototipo.md`.
- [x] Mini reproductor de video implementado en el prototipo, con factibilidad en `docs/factibilidad-mini-reproductor.md`.
- [x] Correcciones del prototipo para el Magic Remote: foco por puntero y rueda. Pendiente de confirmar en TV.
- [x] Tokens de diseño en borrador (`src/styles/tokens.json`, `tokens.css`).
- [x] Compilación para Chrome 53 con esbuild, con verificación ES2015 (`npm run build`, `npm run check:es2015`).

## Preguntas abiertas para Diego (al final del trabajo, junto con los datos de la TV)

1. Modelos exactos de las dos TV (número de modelo, p. ej. OLED C1 o similar) y versión de webOS de cada una (Ajustes → Información de la TV). Con eso se confirma el motor web.
2. ¿Framework: JS plano (más compatible con motores antiguos) o Enact (más estructura)?
3. ¿Uso solo personal por ahora, o preparar la app para tienda desde el inicio?
4. ¿Qué tipo de archivos tiene en Drive (mp4, mkv, tamaños típicos)? Esto define si hace falta transcodificar.

## Riesgos principales

| Riesgo | Impacto | Cómo validar |
|---|---|---|
| Scopes de Drive no permitidos en device flow | Alto: no hay login | Hito 2, primera prueba |
| `alt=media` sin soporte de `Range` | Alto: sin seek | Hito 3/4 con petición real |
| Motor web del TV 2020 muy antiguo | Medio: sintaxis y APIs | Consultar versión, probar con build ES2017 |
| Sesión de Developer Mode caduca y borra la app | Medio: reinstalar con frecuencia | Medir en Hito 5 |
| Refresh token expira a los 7 días en modo prueba | Medio: re-login periódico | Validar en Hito 2 |
| Costos o requisitos de tienda no verificados | Bajo hoy, alto si se distribuye | Revisar Seller Lounge antes de decidir |

## Verificación (cómo sabremos que funciona)

1. Hito 0: `ares-package` genera un `.ipk` válido a partir de la app de prueba.
2. Hito 2: se obtiene un access token y un refresh token desde el device flow con scopes de Drive.
3. Hito 3: `files.list` devuelve archivos de video de una carpeta de prueba.
4. Hito 5: en cada TV, la app se instala, lista archivos, reproduce un mp4 con seek y reanuda tras pausa.

## Archivos del proyecto a crear (cuando se apruebe el plan)

- `/home/user/dlc.tvs/README.md`
- `/home/user/dlc.tvs/docs/investigacion-webos.md` (hallazgos con fuentes)
- `/home/user/dlc.tvs/docs/plan.md` (copia de este plan, versionada)
- `/home/user/dlc.tvs/docs/pruebas.md` (matriz de pruebas por TV)
- `/home/user/dlc.tvs/app/appinfo.json`, `app/index.html`, `app/src/` (esqueleto de la app)

Rama de trabajo: `claude/focused-cray-opspx4`.

## Decisiones tomadas (2026-10-20)

- **Destino:** las dos TV, con un solo build. La app detecta en tiempo de ejecución la versión de webOS y el motor web, y se adapta cuando sea necesario. [Inferencial: lectura de la respuesta de Diego "que la aplicación lo identifique y ejecute"; confirmar.]
- **Uso:** personal por ahora.
- **Formatos a soportar:** audio, imágenes y video en mp4, mkv y HEVC. La compatibilidad real de mkv y HEVC se valida en cada TV (Hito 5).
- **Cuenta de desarrollador LG:** Diego debe revisar si ya tiene una. Revisión en Gmail hecha el 2026-10-20: sin correos de LG Developer ni de Seller Lounge (solo promociones y alertas de empleo). Verificación definitiva pendiente de Diego.
- **Interfaz:** ver [docs/diseno-interfaz.md](diseno-interfaz.md). Pendiente de aprobación.

## Pendiente de Diego

- Framework: JS plano o Enact (pregunta 2, parcialmente respondida).
- Modelos y versión de webOS de cada TV (pregunta 1).
- Aprobación de la barra superior y del prototipo (diseño).

## Avance (2026-10-20): Hitos 2 y 3 sin TV

- **Hito 2 (autenticación):** `app/src/auth/deviceFlow.js`. Solicitud de código, sondeo con `authorization_pending` y `slow_down`, renovación de token y expiración con margen de 60 s. Probado con respuestas simuladas.
- **Hito 3 (Drive):** `app/src/drive/driveClient.js`. Listado paginado de carpetas y medios (video, audio, imagen), clasificación por MIME y URL de contenido con `alt=media`. Probado con respuestas simuladas.
- **Pruebas:** `npm test` (Node 22, runner integrado). 15 pruebas, todas pasan.
- **Sintaxis:** ES2017 sin optional chaining ni nullish, por el motor web de la TV de 2020. Módulos ES.
- **Pendiente sin TV:** verificar `Range` en `alt=media` y los scopes de Drive con device flow. Requiere credenciales (Hito 4).

## Riesgos nuevos identificados al programar

1. **Token en la URL del reproductor.** Un `<video>` no puede enviar cabeceras, así que `mediaUrl` pone `access_token` en la URL. El token puede quedar en registros o historial. Alternativa a evaluar: proxy propio que añada la cabecera.
2. **Client secret en el dispositivo.** El flujo de TV de Google exige `client_secret` en el intercambio de token. Un secreto en una app distribuida no es confidencial. Para uso personal se guarda en un archivo local fuera del repositorio. Para distribución se evalúa un proxy.

## Corrección de supuestos (2026-10-21, por etiquetas de las TV)

- La TV "2023" es un **OLED48A1PSA** fabricada en 12/2021 (modelo 2021, webOS 6.0 según distribuidor). No es de 2023.
- La TV "2020" es un **OLED55B9PSB** fabricada en 08/2019. Fuentes secundarias indican webOS 4.5 de fábrica. No está verificado si subió a webOS 5.
- **Impacto en código:** `app/src/auth/deviceFlow.js` y `app/src/drive/driveClient.js` usan `async/await`, que requiere Chromium 55 o superior. Si la TV de 2020 queda en webOS 4.5, el motor es anterior a eso y hay que transpilar (por ejemplo, Babel con objetivo Chrome 53) antes de empaquetar. Decisión pendiente hasta leer la versión de webOS en la TV.

## Decisión de compatibilidad (2026-10-21)

- **Confirmado por Diego:** las dos TV deben funcionar. Incluye la OLED55B9PSB (2019), que podría estar en webOS 4.5.
- **Objetivo de compilación:** Chrome 53, script clásico (IIFE) generado con esbuild. Sin módulos ES en el navegador, porque Chrome 53 no los soporta en `<script type="module">`.
- **Verificación:** `npm run check:es2015` (parser ES2015) y revisión del bundle sin APIs posteriores a Chrome 53. Carga correcta en Chromium moderno.
- **Pendiente:** ejecutar en las TV reales. Chrome 53 no está disponible aquí, así que la prueba de compatibilidad sigue en el Hito 5.

## Versión de webOS leída en la TV (2026-10-21)

- **TV 2019 (OLED55B9PSB):** webOS TV 4.10.2-31. Según fuente secundaria, webOS 4.x usa Chromium 53. Por eso el objetivo de compilación `chrome53` se mantiene y no se cambia.
- **TV 2021 (OLED48A1PSA):** pendiente de leer la versión de webOS en la misma pantalla.
- Datos de identificación del equipo (número de serie, direcciones MAC, ESN, VSN y claves Widevine) no se guardan en el repositorio.

## Versiones de webOS completas (2026-10-21)

- **TV 2019 (OLED55B9PSB):** webOS TV 4.10.2-31. Firmware 05.50.00.
- **TV 2021 (OLED48A1PSA):** webOS TV 6.5.3-47. Firmware 03.53.45. Sin actualizaciones disponibles.
- **Impacto:** el objetivo de compilación `chrome53` cubre las dos TV. La TV de 2021 tiene un motor más nuevo, así que cualquier sintaxis válida para Chrome 53 también corre allí.
