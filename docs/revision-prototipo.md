# Revisión del prototipo CodeTV

Fecha: 2026-10-20. Archivo revisado: `docs/prototipo/CodeTV.html`.

## Método

- Prototipo abierto en Chromium headless a 1920x1080. Sin errores de consola en ningún recorrido.
- **Control D-pad:** flechas, Enter = OK, Escape = Atrás. El código 461 de webOS para Atrás está soportado en el código.
- **Magic Remote (puntero):** clics y movimiento del puntero simulados con el ratón, y rueda.
- Recorridos: inicio, barra superior, sección Video, detalle, reproductor, menú de audio y subtítulos, mini reproductor de video y música.

**Limitación:** las pruebas son en un navegador de escritorio. El control físico Magic Remote y la TV real quedan para el Hito 5 del plan. La matriz de pruebas (`docs/pruebas.md`) ya incluye esos casos.

## Resultados

| Área | Control | Resultado | Evidencia |
|---|---|---|---|
| Carga y estructura | Todos | OK. Sin errores de consola. | Recorridos automatizados |
| Barra superior y foco | D-pad | OK. Arriba lleva a la barra y las flechas cambian de sección. | `revision/video-seccion.png` |
| Desplazamiento de filas | D-pad | OK. La fila enfocada se muestra completa al bajar. | `revision/video-desplazamiento.png` |
| Reproductor | D-pad | OK. Barra de progreso, 10 s, pausa, audio y subtítulos. | `revision/reproductor.png` |
| Menú de audio y subtítulos | D-pad | OK. Se abre desde el reproductor y muestra la pista activa. | `revision/menu-audio-subtitulos.png` |
| Clic en pestañas y tarjetas | Magic Remote (puntero) | OK. Abre la sección y el detalle. | `revision/magic-clic-tarjeta.png` |
| Foco al pasar el puntero | Magic Remote (puntero) | **Falla.** Pasar el puntero sobre una opción no mueve el foco. | `revision/magic-hover-sin-foco.png` |
| Rueda del Magic Remote | Magic Remote (rueda) | **Falla.** La rueda no desplaza la lista de videos. | `revision/magic-rueda-sin-desplazamiento.png` |
| Mini reproductor de música | D-pad y puntero | OK. Visible en la barra superior con una pista seleccionada. | `captura-inicio.png` |
| Mini reproductor de video | D-pad y puntero | OK tras implementarlo. Aparece al salir del reproductor, se reabre con clic o OK, y se cierra con la "×". | `revision/mini-video-en-barra.png`, `revision/mini-video-cerrado.png` |
| Pausa de música al iniciar video | D-pad | OK. El reproductor de video pausa la música. | `revision/mini-video-cerrado.png` (música en pausa) |
| Renombre a CodeTV | Todos | OK. Marca, título y diálogos actualizados. | Revisión de texto |
| Correo de ejemplo | Todos | OK. Reemplazado por `usuario@ejemplo.com`. | Revisión de texto |

## Hallazgos

### 1. Foco no sigue al puntero (prioridad alta)

- Con el Magic Remote, el usuario espera que el foco siga al puntero. Hoy no ocurre: solo el clic activa la opción.
- Recomendación: que el puntero sobre una tarjeta o una pestaña mueva el foco a esa opción, sin ejecutarla.

### 2. La rueda no desplaza la lista (prioridad alta)

- La rueda del Magic Remote no mueve el contenido. Solo el foco por flechas desplaza.
- Recomendación: que la rueda desplace la vista de la sección activa, y que el foco siga visible tras desplazarse.

### 3. Texto de 20 px (decidido)

- Diego confirmó que el mínimo de texto se mantiene en 20 px para aprovechar el tamaño de la pantalla.
- El tamaño "Mínimo" (16 px) queda como opción del usuario. Si se quiere que nunca baje de 20 px, se corrige en el prototipo.

### 4. Mini reproductor de video (implementado)

- Se implementó en el prototipo. Usa un solo elemento de video, la música se pausa al iniciar el video, y el mini de video reemplaza al de música mientras esté activo.
- El video del prototipo es un marcador (fotograma de muestra). El video real se valida en el Hito 5, en la TV de 2020 y en la de 2023.

### 5. Miniaturas de muestra

- Las miniaturas son bandas diagonales, no imágenes. Esperado en un prototipo. Conviene probar el recorte y el texto con miniaturas reales.

### 6. Foco inicial en el reproductor

- Al abrir el reproductor, el foco va a la barra de progreso. Hay que confirmar con el control físico que la pausa es lo primero que llega con Abajo.

## Pendientes antes de programar

1. Corregir el foco por puntero y el desplazamiento con la rueda (hallazgos 1 y 2).
2. Probar todo en la TV con el Magic Remote físico (Hito 5).
3. Validar el video real en el mini reproductor (Hito 5).
