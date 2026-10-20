# Factibilidad: mini reproductor de video

Fecha: 2026-10-20. Alcance: CodeTV (webOS TV, control remoto).

Regla de producto (definida por Diego): el mini reproductor se mantiene visible mientras haya algo en reproducción.

Convención: **[Verificado]** = fuente primaria o prueba en este entorno. **[Fuente secundaria]** = foro o documentación de terceros. **[Inferencial]** = deducción. **[No verificado]** = requiere prueba en la TV.

## 1. Estado actual

- Música: el mini reproductor ya existe en la barra superior y aparece en cuanto hay una pista seleccionada, aunque esté en pausa. [Verificado en el prototipo: `hasMini: !!curT`.]
- Video: no existe. Al salir del reproductor de video, la reproducción se pierde.

## 2. Restricción técnica principal: un solo video a la vez

- Un foro oficial de desarrolladores de LG indica que reproducir dos o más videos a la vez no está soportado en webOS TV. [Fuente secundaria: forum.webostv.developer.lge.com, hilo "Multiple video tags to simultaneously play video content".]
- signageOS documenta 1 video simultáneo en webOS 3.0 y superiores, con resolución máxima FullHD para ese caso. [Fuente secundaria.]
- Signagelive indica que el límite depende de la generación del panel y es mayor en modelos recientes, pero no pude leer la tabla con los números. [Fuente secundaria.]
- Un intento de doble video en un hilo del foro reporta que el primer video queda en negro al iniciar el segundo. [Fuente secundaria.]

**Conclusión:** el mini reproductor no puede abrir un segundo `<video>` con su propio stream. Debe ser el mismo elemento `<video>`, reducido y reubicado.

## 3. Factibilidad por aspecto

| Aspecto | Evaluación | Comentario |
|---|---|---|
| Mismo elemento `<video>` reducido con CSS (posición y escala) | Factible [Inferencial] | No requiere un segundo decodificador. Hay que probar que el video se siga dibujando sobre la capa web en la TV. [No verificado] |
| Mantener la reproducción al cambiar de sección | Factible si el reproductor vive fuera de las pantallas | Si el elemento se desmonta al navegar, la reproducción se corta. Hay que mover el reproductor a una capa global con su propio estado. |
| Superponer controles y UI sobre el video | Factible [Inferencial] | En algunos webOS el video va en un plano de hardware por debajo de la web. Hay que confirmar que los controles se ven encima. [No verificado] |
| Rendimiento con video 4K HDR en TV de 2020 | Riesgo | Reducir el tamaño no reduce el costo de decodificar. Hay que medir en la TV de 2020. [No verificado] |
| Audio simultáneo (música y video) | Decisión de producto | Lo más simple: al iniciar video se pausa la música. Ver sección 5. |
| Navegación con control remoto | Factible | Ver sección 4. |

## 4. Propuesta de comportamiento

1. **Dónde aparece:** en la misma posición del mini reproductor de música (extremo derecho de la barra superior, antes de Ajustes).
2. **Qué muestra:** un recuadro 16:9 pequeño con el fotograma actual (el video real, si la prueba de rendimiento lo permite), título y estado (reproduciendo o en pausa).
3. **Cuándo aparece:** mientras haya un video cargado, reproduciéndose o en pausa. Desaparece solo cuando el usuario lo cierra.
4. **Cómo se cierra:** desde el propio mini reproductor, enfocado y con OK en un botón "Cerrar" (botón secundario). Atrás no lo cierra, para evitar cierres accidentales.
5. **Cómo se vuelve al reproductor completo:** enfocar el mini reproductor desde la barra superior (con Abajo o con Derecha desde Ajustes) y pulsar OK. Se reanuda en el mismo segundo.
6. **Prioridad cuando hay música y video:** el mini de video reemplaza al mini de música. La música queda en pausa y se puede reanudar desde Música.
7. **Salida del reproductor completo:** Atrás vuelve a la sección anterior y el mini de video permanece.

## 5. Decisiones que necesito de Diego

1. ¿Al iniciar un video se pausa la música (propuesta), o la música sigue en segundo plano?
2. ¿El mini de video reproduce el video real, o solo muestra un fotograma con progreso? La segunda opción es más segura para el rendimiento en la TV de 2020.
3. ¿Cuánto tiempo debe permanecer el mini sin reproducción activa (pausa)? Propuesta: indefinidamente, hasta que el usuario lo cierre.

## 6. Plan de validación (cuando tengas la TV disponible)

1. Reproducir un mp4 H.264 1080p y un mkv HEVC 4K en la TV de 2020 y en la de 2023 con el elemento `<video>` reducido a 280x158 px.
2. Medir: caída de fotogramas, si los controles quedan encima del video, y si el video se corta al navegar entre secciones.
3. Si la TV de 2020 no soporta el video reducido sin problemas, usar la opción de fotograma fijo de la decisión 2.

## 7. Conclusión

Factible, con dos condiciones:

- Un único elemento `<video>` que viva en una capa global de la app, nunca dentro de una pantalla.
- Validación en la TV de 2020 antes de comprometer el modo de video real en el mini reproductor.

Este documento no modifica el prototipo. Cuando se aprueben las decisiones de la sección 5, se agrega el comportamiento al prototipo.

## 8. Decisiones tomadas (2026-10-20)

1. **Iniciar video pausa la música.** Confirmado por Diego. No se reproducen dos archivos a la vez.
2. **Video real en el mini.** Confirmado. En el prototipo se muestra un marcador; el video real se valida en el Hito 5.
3. **Duración del mini en pausa:** se mantiene hasta que el usuario lo cierre con la "×" (propuesta aceptada por la regla de Diego de mantenerlo mientras haya reproducción).

## 9. Implementación en el prototipo

- Al salir del reproductor, el mini de video reemplaza al de música en la barra superior.
- Clic u OK en el mini reabre el reproductor en el mismo segundo. La "×" lo cierra sin reabrirlo.
- Verificado con recorridos automatizados: aparece, se reabre con clic, se cierra con la "×" y la música queda en pausa.
- Pendiente de validar en la TV: video real, rendimiento y superposición de controles.
