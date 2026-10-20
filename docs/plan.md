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

**Hito 0 — Verificaciones técnicas sin credenciales (lo hago ahora, en cuanto salga del modo plan)**
- [ ] Crear estructura del proyecto: `/home/user/dlc.tvs/` con `README.md`, `docs/`, y carpeta `app/` (appinfo.json, index.html, src/).
- [ ] Documentar en `docs/` los hallazgos de esta investigación, con fuentes y marcas `[No verificado]`.
- [ ] Instalar `@webos-tools/cli` en el entorno (si el sandbox lo permite) y verificar comandos `ares-*`.
- [ ] Crear una app "hola mundo" empaquetada con `ares-generate` y `ares-package` (no se instala aún).
- [ ] Preparar matriz de pruebas de códecs y contenedores (mp4 H.264 AAC, mkv, HEVC, AV1) para probar en TV.

**Hito 1 — Decisiones de diseño (con Diego)**
- [ ] Framework: JS plano o Enact.
- [ ] Modo de uso inicial: solo personal en modo desarrollador, o preparar para tienda desde el principio.
- [ ] Proveedor de Google Cloud: cuenta de Diego, proyecto nuevo.

**Hito 2 — Autenticación con Google (sin pruebas en TV)**
- [ ] Diseño del flujo device code (pantalla con código + URL de verificación).
- [ ] Validar que los scopes de Drive funcionan con device flow (prueba con cliente de escritorio o curl usando las credenciales del Hito 4; si no se puede, documentar el bloqueo).
- [ ] Módulo de refresh token con reintentos y manejo de expiración de 7 días.

**Hito 3 — Cliente de Drive y reproductor (sin TV, con mocks)**
- [ ] Listado de carpetas y archivos de video, con paginación (`pageToken`).
- [ ] Reproducción con `<video>` a partir de URL autenticada (o proxy).
- [ ] Pruebas unitarias del cliente con respuestas simuladas.
- [ ] Verificar `Range` en `alt=media` con una petición real (requiere credenciales → Hito 4).

**Hito 4 — Credenciales y configuración (lo hace Diego)**
- [ ] Cuenta de desarrollador LG (LG Seller Lounge / cuenta LG).
- [ ] Activar Developer Mode en ambos TV; anotar IP de cada TV y la clave/passphrase que muestra la app.
- [ ] Proyecto en Google Cloud Console, API de Drive habilitada, OAuth client de tipo "TV and Limited Input devices".
- [ ] Cuenta de Google con archivos de prueba (mp4, mkv).

**Hito 5 — Despliegue y pruebas en TV**
- [ ] Configurar perfil de la CLI para cada TV (`ares-setup-device`).
- [ ] `ares-package` + `ares-install` + `ares-launch` en el TV de 2020 y en el de 2023.
- [ ] Pruebas: login, listado, reproducción, seek, pausa, reanudación, pérdida de red, expiración de sesión de Developer Mode.
- [ ] Registrar resultados por TV en `docs/pruebas.md`.

**Hito 6 — Hardening y futuro**
- [ ] Manejo de errores y logs de depuración.
- [ ] Preparar proveedores adicionales (abstracción de "fuente de contenido").
- [ ] Evaluar requisitos de Content Store solo si se decide distribuir.

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
