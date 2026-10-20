# Diseño de interfaz: CodeTV

Fecha: 2026-10-20.

Convención: **[Verificado]** = visto en fuente primaria o noticia. **[Fuente secundaria]** = resumen de terceros. **[Inferencial]** = deducción de este documento. **[No verificado]** = requiere prueba en la TV o documentación oficial vigente.

## 1. Alcance y restricciones

- Pantalla de TV con Magic Remote: D-pad (flechas), OK, Atrás, puntero y rueda. El puntero debe mover el foco y la rueda debe desplazar las listas. Ninguna pantalla puede requerir escribir texto con el control.
- Contenido: audio, imágenes y video (mp4, mkv, HEVC) almacenados en Google Drive.
- Uso personal por ahora. Un solo usuario por TV.
- Dos TV (2020 y 2023). La interfaz debe ser idéntica en ambas.

## 2. Referencias revisadas

| Servicio / referencia | Patrón de navegación | Fortalezas | Debilidades | Fuente |
|---|---|---|---|---|
| Netflix (Apple TV, v3.0) | Barra superior con secciones (Buscar, Inicio, Series, Películas, Mi Netflix) | Contenido al centro, navegación simple | Reportes de 2024 señalan que la app tvOS quedó atrás en funciones | [Verificado] MacRumors 2025; Mercury blog. Estado de 2024: [Fuente secundaria] |
| Plex (Apple TV) | Navegación propia de biblioteca | Uniformidad entre clientes | Reclamos por reproductor personalizado distinto al estándar del sistema | [Fuente secundaria] Plex Forum |
| Apple tvOS (HIG) | Foco como base de toda interacción; el foco debe verse a distancia | Reglas claras de foco | Documentación oficial no consultada directamente; resúmenes de terceros | [Fuente secundaria] resúmenes de skills de tvOS |
| Mercury (análisis de 17 apps con navegación superior) | Estudio de comportamiento de foco | Datos de comportamiento | No es la fuente de cada app | [Fuente secundaria] Mercury blog |
| LG Smart TV UI Guideline v4.18 | Área segura y resolución 1280x720 | Guía de LG | Antigua (2014); valores pueden no aplicar a webOS actual | [Verificado] PDF en developer de LG |

Pendiente: Disney+ no quedó cubierto. Google TV/Material TV tampoco. No se pudo abrir la documentación oficial vigente de LG (el dominio no resolvió desde el entorno).

## 3. Principios de diseño adoptados

1. **Foco siempre visible.** Todo elemento enfocado muestra un borde o resaltado, y además escala (~1.05x) [Fuente secundaria: resúmenes de tvOS]. Nunca depender solo del color.
2. **Navegación predecible.** Arriba/abajo cambia de fila; izquierda/derecha se mueve dentro de la fila. Atrás sube un nivel. Siempre el mismo comportamiento.
3. **Pocos destinos principales.** Máximo 5 secciones en la barra superior.
4. **Texto grande y poco texto.** Títulos y metadatos cortos. Tamaño de cuerpo mínimo: [No verificado] ~29 pt en TV (resúmenes de tvOS), equivalente a unos 40 px en 1080p. Validar en pantalla real.
5. **Contraste.** Fondo oscuro, texto claro. Objetivo WCAG AA: 4.5:1 en texto normal, 3:1 en texto grande [Fuente secundaria].
6. **Área segura.** Dejar margen de ~5% en los bordes (LG: todos los elementos dentro de la safe area) [Verificado en guía antigua de LG; valor actual No verificado].
7. **Sin escritura con el control.** Autenticación por código: la TV muestra un código y una URL; el usuario la abre en el teléfono. Coincide con el flujo de dispositivo de Google (Hito 2 del plan).
8. **Estados explícitos.** Cargando, vacío, sin red, error de sesión y "sin permisos" tienen pantalla propia con acción clara.

## 4. Propuesta de estructura

### 4.1 Barra superior (5 secciones)

```
[ Inicio ]  [ Explorar ]  [ Video ]  [ Música ]  [ Fotos ]        [ Ajustes ]
```

- **Inicio:** resumen personal, lo más útil primero.
- **Explorar:** árbol de carpetas de Drive, tal cual está organizado.
- **Video, Música, Fotos:** vistas por tipo de archivo, para llegar rápido sin recorrer carpetas.
- **Ajustes:** cuenta vinculada, cerrar sesión, idioma, información de la app y de la TV.

Justificación: Netflix y Apple TV usan barra superior; Mercury reporta que casi la mitad de las apps cambian de sección al enfocar el menú, así que la barra no debe cambiar contenido solo con mover el foco [Inferencial: decidir con una pantalla de prueba]. La decisión final es que el cambio de sección ocurre con OK, no con foco.

### 4.2 Pantalla Inicio (filas horizontales)

```
Continuar viendo        [miniatura][miniatura][miniatura] ...
Recientes               [miniatura][miniatura][miniatura] ...
Carpetas favoritas      [carpeta][carpeta][carpeta] ...
```

- Cada fila tiene título, máximo ~8 elementos visibles, y "Ver todo" al final.
- "Continuar viendo" guarda posición de reproducción por archivo.
- Las miniaturas de video usan el primer frame o una miniatura de Drive cuando exista.

### 4.3 Explorar (Drive tal cual)

```
Mi unidad > Series > Temporada 2                       [Ordenar: Nombre v]
[ carpeta ]  Capítulo 01.mkv   1.2 GB
[ carpeta ]  Capítulo 02.mkv   1.1 GB
```

- Lista vertical con icono de tipo, nombre y tamaño.
- Migas de pan arriba (ruta actual). Atrás sube un nivel.
- Ordenar por nombre, fecha o tamaño; el orden se recuerda por carpeta.
- Carpetas primero, luego archivos.

### 4.4 Video

- Detalle de archivo: título, duración, resolución, pistas de audio y subtítulos disponibles. Botones: Reproducir, Continuar (si hay posición guardada).
- Reproductor a pantalla completa:
  - Controles aparecen al pulsar cualquier botón y se ocultan a los 4 s [Inferencial].
  - Izquierda/derecha: saltar 10 s; mantener pulsado: saltar 30 s.
  - OK: pausa/reproduce. Atrás: sale del reproductor y guarda posición.
  - Menú de pistas de audio y subtítulos (importante en mkv con varias pistas).
  - Barra de progreso con tiempo actual y total.

### 4.5 Música

- Lista de pistas con carátula si existe, artista y duración.
- Reproducción en segundo plano mientras se navega a otras secciones. [Inferencial: validar que webOS permita esto en la app web.]
- Pantalla "Reproduciendo" con controles mínimos: anterior, reproducir/pausa, siguiente, aleatorio, repetir.

### 4.6 Fotos

- Cuadrícula de miniaturas (3 a 4 columnas).
- OK abre visor a pantalla completa. Izquierda/derecha cambia foto.
- Botón de presentación automática, con intervalo configurable en Ajustes (5, 10, 30 s).

### 4.7 Ajustes

- Cuenta: correo vinculado, estado de sesión, cerrar sesión.
- Preferencias: idioma, intervalo de presentación, ordenamiento por defecto.
- Información: versión de la app, versión de webOS, motor web (el dato de Chromium ayuda al debug).

## 5. Flujo de autenticación

1. Primera vez: pantalla con código y URL de verificación (como el flujo de dispositivo de Google).
2. Mientras el usuario completa el paso en el teléfono, la TV muestra un temporizador y el estado "Esperando autorización".
3. Éxito: pasa a Inicio. Error o expiración: botón "Generar código nuevo".
4. Sesión caducada más adelante: pantalla de reautenticación, sin perder el progreso guardado.

## 6. Reglas de foco y navegación (criterios de revisión)

- Al abrir la app, el foco va al primer elemento de la fila principal, no a la barra superior. [Inferencial]
- Ningún elemento enfocado queda fuera de la pantalla.
- Mover el foco no ejecuta acciones; solo OK ejecuta.
- Atrás nunca cierra la app desde una sección que no sea Inicio. Desde Inicio, pide confirmación.
- Probar cada pantalla solo con el control remoto antes de dar por buena.

## 7. Estados y errores

| Estado | Mensaje | Acción |
|---|---|---|
| Cargando lista | Indicador | Ninguna |
| Carpeta vacía | "No hay archivos compatibles" | Volver |
| Sin red | "Sin conexión" | Reintentar |
| Sesión caducada | "Vuelve a iniciar sesión" | Generar código |
| Archivo no reproducible | "Formato no compatible con esta TV" | Volver; registrar en log |
| Cuota o límite de Drive | "Intenta más tarde" | Reintentar en 1 min |

## 8. Accesibilidad

- Contraste mínimo 4.5:1 en texto normal [Fuente secundaria].
- Subtítulos: respetar el idioma y estilo elegido en la TV.
- Ninguna información depende solo de color (estado de reproducción, foco, error).
- Textos legibles desde 2.5 a 3.5 m [Fuente secundaria]. Validar en las dos TV.

## 9. Prototipo y validación

Se recomienda hacer un prototipo navegable antes de programar la lógica completa:

1. Maqueta estática de cada pantalla (1920x1080, con área segura).
2. Prueba con el control real en la TV de 2020 y en la de 2023.
3. Criterios de aceptación: encontrar un video en Explorar en menos de 30 s; reanudar un video en menos de 10 s desde Inicio; cambiar de sección con no más de 2 pulsaciones.

Propuesta: crear el prototipo en Figma (la herramienta está disponible en este entorno) o como HTML estático en `app/`. Decisión pendiente de Diego.

## 10. Decisiones pendientes para Diego

1. ¿Aprueba la barra superior con cinco secciones (Inicio, Explorar, Video, Música, Fotos) y Ajustes a la derecha?
2. ¿Prototipo en Figma o HTML estático?
3. ¿Prefiere que el reproductor de música siga sonando al navegar a otras secciones?
4. ¿Idioma de la interfaz: solo español o también inglés?
