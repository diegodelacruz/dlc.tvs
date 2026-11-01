# Manual de usuario de CodeTV

CodeTV es una aplicación para televisores LG con webOS que reproduce audio, imágenes y video guardados en **Google Drive**. Se usa con el control remoto Magic Remote o el control de flechas.

Este manual describe lo que hace la app y cómo usarla. Para detalles técnicos, ver [arquitectura.md](arquitectura.md) (español) o [en/implementation.md](en/implementation.md) (inglés).

## 1. Antes de empezar

- **Carpetas compartidas.** La app solo ve las carpetas de Drive que se comparten con su cuenta de servicio. Esas carpetas son la biblioteca. Para agregar una carpeta, compártela con el correo de la cuenta de servicio (campo `client_email` de la llave) con permiso de lector.
- **Proxy (opcional, recomendado).** Para mp4 con el índice al final, subtítulos y archivos que la TV no reproduce directamente, la app usa un proxy en una computadora de la red local. Sin proxy, la reproducción es directa y algunos archivos no se pueden abrir.
- **Formatos.** Ver la tabla de formatos en [pruebas.md](pruebas.md). El formato OGG con Vorbis no se reproduce en la TV de 2021.

## 2. Control remoto

| Botón | Acción |
|---|---|
| Flechas | Mover el foco al elemento más cercano en esa dirección. |
| OK (Enter) | Abrir, reproducir o pulsar el botón enfocado. |
| Atrás (461, 27 u 8) | Subir un nivel, cerrar visor o salir de la vista completa. Ver la sección 9. |
| Izquierda / derecha (en vista completa) | Retroceder o avanzar 10 s. |
| Arriba / abajo (en vista completa) | Mostrar los controles. |

## 3. Pantallas

### Inicio

- **Continuar viendo.** Muestra **una tarjeta por carpeta**: el último video en curso de cada carpeta, el más reciente primero. Debajo del título aparece la carpeta y su nivel superior (por ejemplo, "Temporada 1 · Serie"). Al terminar un video, la reproducción sigue con el siguiente de **su carpeta**. "Ver todo" abre Explorar.
- **Recientes.** Muestra los **últimos videos vistos**, de cualquier carpeta, en el orden en que se vieron (el último primero). Al elegir uno, el siguiente de la lista sigue la reproducción, sin importar la carpeta.
- **Biblioteca.** Accesos a Música, Fotos y Explorar.
- **Carpetas favoritas.** Las carpetas marcadas con la estrella en Explorar.

### Explorar

- **Ruta.** Muestra la carpeta actual. OK entra en una carpeta; Atrás sube un nivel.
- **Ordenar por.** Nombre, Fecha o Tamaño. La flecha indica el sentido: hacia arriba para ascendente, hacia abajo para descendente. Pulsar el orden activo invierte el sentido. El orden es el mismo en Música y Fotos.
- **Favorita (estrella).** Marca o quita la carpeta actual de favoritas. Está separada del orden por una línea.
- **Vistas.** Lista (compacta), detalle (con fecha y tamaño) y miniatura (tarjetas, con fotograma para los videos). La vista también se comparte con Música y Fotos.
- **Recargar (flechas circulares).** Vuelve a leer Drive. Úsalo después de compartir una carpeta nueva: no hace falta reiniciar la app.
- **Posición.** Al salir de Explorar y volver, la lista queda donde la dejaste.
- **Indicador de posición.** Una barra a la derecha muestra qué parte de la lista estás viendo. Se atenúa tras 3 s sin navegar y no aparece mientras hay un video en reproducción.

### Video

Desactivada por defecto (interruptor `videoSection` en `app/flags.js`). Los videos se encuentran en Explorar y en Inicio.

### Música

- **Reproducir todo** y **Aleatorio** (iconos) empiezan la lista completa.
- La lista usa el mismo orden y vista que Explorar.
- La pista que suena aparece marcada como "Sonando" o "En pausa". Debajo, los controles anterior, reproducir/pausa, siguiente, aleatorio y repetir.
- La música se pausa cuando empieza un video.

### Fotos

- **Iniciar presentación** (icono de reproducir) muestra las fotos una tras otra. El intervalo se configura en Ajustes.
- OK sobre una foto abre el visor. Izquierda y derecha cambian de foto; Atrás cierra el visor.
- Comparte el orden y la vista con Explorar.

### Ajustes

- **Tema:** Negro OLED, Nocturne, Grafito ámbar, Bosque o Alto contraste.
- **Tipo de letra:** Inter, Atkinson Hyperlegible o Fira Code.
- **Tamaño de texto:** Normal, Pequeño, Muy pequeño o Mínimo.
- **Idioma:** Español o English. Al cambiarlo, la app se recarga y todo se muestra en el idioma elegido.
- **Intervalo de presentación:** 5, 10 o 30 segundos.
- **Orden por defecto:** el orden inicial de las listas.
- **Errores recientes:** registro con fecha, hora, explicación, qué hacer y detalle técnico. El más reciente va primero. Se puede borrar.
- **Estado:** cuenta de servicio, biblioteca, proxy y motor web.
- **Cerrar sesión:** borra en esta TV el progreso, los recientes, las favoritas y los ajustes. No borra nada en Drive.

## 4. Reproducción

### Mini reproductor

Se abre al pasar de la vista completa con Atrás. Muestra el video pequeño en la esquina superior o inferior derecha.

- **Izquierda:** video anterior, reproducir/pausa, video siguiente.
- **Derecha:** ver completo, cambiar tamaño (normal o grande), cambiar esquina.
- **Arriba a la derecha:** cerrar. Los controles aparecen al pasar el puntero o al usar el control remoto, y se ocultan solos.

### Vista completa

- **Barra de progreso.** Tiempo transcurrido a la izquierda, tiempo restante a la derecha (con signo menos). Al enfocarla solo se resalta el indicador.
- **Botones:**
  - Retroceso rápido: sube la velocidad de retroceso (0.5x, 1x, 1.5x, 2x, 5x, 10x).
  - Retroceder 10 s.
  - Anterior.
  - Reproducir/pausa. Si estás avanzando a otra velocidad, este botón muestra un icono de reinicio y vuelve a 1x.
  - Siguiente.
  - Avanzar 10 s.
  - Avance rápido: sube la velocidad de avance (0.5x, 1x, 1.5x, 2x, 5x, 10x).
  - Audio y subtítulos.
- Debajo de los botones de avance y retroceso aparece la velocidad actual.

### Velocidades y audio

- Solo se escucha el audio a **1x**. A cualquier otra velocidad el sonido se silencia.
- El retroceso rápido avanza hacia atrás en pasos de un segundo, a la velocidad elegida, y deja el video en pausa. No es un retroceso continuo, así que puede verse entrecortado en archivos grandes.
- Si la posición retrocede al cambiar de velocidad, la app la corrige y lo registra en Ajustes.

### Cola: siguiente y anterior

- Desde **Continuar viendo**: el siguiente es el de la **misma carpeta**, en orden de nombre.
- Desde **Recientes**: el siguiente es el de la **lista de recientes**, sin importar la carpeta.
- Desde Explorar o Música: el de la lista que estás viendo.
- Al llegar al final de la cola, la reproducción se detiene; no salta a otra carpeta.

### Subtítulos y pistas

El botón de audio y subtítulos abre un panel para elegir la pista de audio y los subtítulos incrustados en el archivo. Los subtítulos en formato imagen (PGS, VobSub) no se convierten.

## 5. Atrás

Atrás actúa de forma ordenada:

1. Cierra el visor de fotos.
2. Si la lista no está al inicio, sube al inicio y lleva el foco al primer elemento.
3. En Explorar, sube a la carpeta anterior.
4. En vista completa, primero cierra el panel de pistas, después oculta los controles y al final pasa al mini.
5. En las demás secciones, vuelve a la sección anterior o a Inicio.

## 6. Errores y el semáforo

El botón de engranaje (Ajustes) se pinta de **rojo discreto** cuando hay errores sin revisar. Solo se ve mientras navegas. Al abrir Ajustes, los errores se marcan como revisados y el color se apaga.

En **Ajustes → Errores recientes** cada registro muestra:

- Fecha y hora (el más reciente primero) y en qué parte de la app ocurrió.
- Qué pasó, en palabras simples.
- **Qué hacer**, con la acción sugerida.
- El detalle técnico. Nunca incluye llaves, tokens ni el secreto del proxy.

### Problemas comunes

| Mensaje | Qué hacer |
|---|---|
| Falta un archivo de la app | Vuelve a instalar la app completa. |
| Sin conexión con el proxy | Enciende el proxy en la computadora, verifica su IP y que la TV esté en la misma red. |
| Drive niega el acceso | Comparte la carpeta con la cuenta de servicio como lector. |
| Archivo o carpeta no encontrado | Pulsa recargar en Explorar. |
| Formato no soportado por la TV | Convierte el archivo a MP4 (H.264 + AAC) o MKV con pistas compatibles. |
| Se cortó la red durante la reproducción | Revisa la conexión y vuelve a abrir el video. |
| El video no empezó a tiempo | Confirma que el proxy esté encendido. |
| La posición retrocedió al cambiar la velocidad | La app corrigió la posición; anota el video y la velocidad. |

## 7. Privacidad

- Los datos de uso (progreso, recientes, favoritas, ajustes y registro de errores) se guardan **solo en esta TV**.
- La app lee Drive con la cuenta de servicio; no envía nada a terceros.
- El proxy corre en tu computadora y solo sirve a la red local con un secreto.

## 8. Limitaciones conocidas

- El retroceso no puede ser continuo en el navegador de la TV; se hace por pasos.
- Las listas grandes se dibujan por bloques de 60 elementos; la búsqueda recorre hasta 300 carpetas por biblioteca.
- La sección Video está desactivada; sus videos siguen disponibles desde Inicio y Explorar.
- La traducción al inglés cubre la interfaz. Los nombres de archivos y los detalles técnicos de los errores se muestran tal como están.

## 9. Reporte de problemas

Si algo falla, revisa **Ajustes → Errores recientes** y anota la fecha, la hora, el mensaje y el detalle técnico.
