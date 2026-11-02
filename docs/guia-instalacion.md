# Guía de instalación y configuración de CodeTV

Esta guía reúne **todos** los pasos para dejar CodeTV funcionando: cuenta de desarrollador, modo desarrollador en la TV, herramientas en la computadora, cuenta de servicio de Google, proxy, compilación, instalación en la TV y mantenimiento.

Cada paso indica **por qué** se hace. Los pasos marcados con **[Verificado]** se hicieron y comprobaron en esta configuración (TV 2021). Los marcados con **[No verificado]** siguen la documentación de LG o de Google, pero no se ejecutaron tal cual en este proyecto; confírmalos antes de depender de ellos.

## 0. Qué necesitas

| Elemento | Para qué |
|---|---|
| TV LG con webOS 4.5 o superior (probada: OLED48A1PSA, webOS 6.5.3) | Ejecutar la app. |
| Cuenta LG (la misma para la TV y para el portal de desarrolladores) | Activar el modo desarrollador. |
| Computadora (macOS probado; Linux también sirve) con Node.js 18 o superior | Compilar, empaquetar y correr el proxy. |
| Cuenta de Google con Google Drive | Guardar los archivos. |
| Proyecto en Google Cloud con la API de Drive habilitada | Autenticar la app con una cuenta de servicio. |
| ffmpeg (opcional, recomendado) | Remux de mp4 y subtítulos en el proxy. |
| TV y computadora en la **misma red local** | El proxy debe ser alcanzable desde la TV. |

**Por qué:** la TV no puede instalar apps fuera de la tienda sin modo desarrollador, y el proxy necesita la computadora encendida en la misma red.

## 1. Cuenta de desarrollador de LG  [Verificado]

1. Entra al portal de desarrolladores de LG para webOS TV (webostv.developer.lge.com) y crea una cuenta, o inicia sesión si ya tienes una.
2. Usa tu cuenta LG para iniciar sesión en la TV en el paso siguiente.

**Por qué:** la app "Developer Mode" de la tienda de LG exige una cuenta LG, y el acceso por SSH que usa la CLI se autoriza desde esa misma app.

## 2. Modo desarrollador en cada TV  [Verificado]

1. En la TV, abre **LG Content Store**, busca **Developer Mode** e instálala.
2. Ábrela e inicia sesión con tu cuenta LG.
3. Activa **Developer Mode** (interruptor en ON).
4. **Anota** los datos que muestra la app: la **passphrase** (clave de acceso SSH) y el **tiempo restante de la sesión** (por ejemplo, 999 h).
5. Anota también la **IP de la TV** (paso 3).

**Por qué:** el modo desarrollador permite instalar apps que no están en la tienda y abre el acceso SSH que usa `ares-setup-device`.

**Cuidados** (de la investigación del proyecto, ver [investigacion-webos.md](investigacion-webos.md)):
- La sesión **caduca**. Al caducar, la app instalada se **elimina** y hay que reinstalarla.
- Reiniciar la TV sin red puede cerrar la sesión.
- Iniciar sesión con la misma cuenta en otra TV puede cerrar la sesión en la primera. **[No verificado]**

## 3. Red: IP fija o reservada  [Verificado parcialmente]

1. En la TV, consulta la IP en **Ajustes → Red** (la ruta exacta depende de la versión de webOS). Anótala.
2. En el router, asigna una **reserva DHCP** (IP fija por dirección MAC) a la TV, para que la IP no cambie.

**Por qué:** la CLI y el proxy usan la IP. Si la TV cambia de IP, la instalación y el proxy dejan de funcionar (ver la sección 14).

## 4. Herramientas en la computadora  [Verificado]

1. Instala Node.js 18 o superior (probado con v22).
2. Instala la CLI de webOS en una carpeta propia, fuera del repositorio:

   ```bash
   npm install --prefix ~/webos-cli @webos-tools/cli@3.2.6
   export PATH="$HOME/webos-cli/node_modules/.bin:$PATH"
   ```

   Para que el `PATH` quede disponible en cada sesión, agrega la línea `export` a tu archivo de inicio de la terminal.
3. Verifica la instalación con `ares-setup-device --help`.
4. Instala ffmpeg (opcional, para remux y subtítulos en el proxy):

   ```bash
   brew install ffmpeg        # macOS
   ```

**Por qué:** la CLI `@webos-tools/cli` reemplaza a la antigua `ares`. Versión probada: 3.2.6.

## 5. Registrar la TV en la CLI  [Verificado parcialmente]

1. Ejecuta `ares-setup-device` y crea un perfil. Valores usados en este proyecto:

   | Campo | Valor |
   |---|---|
   | Nombre del perfil | `tv2021` (o el nombre que prefieras) |
   | IP | la del paso 3 |
   | Puerto | `9922` |
   | Usuario | `prisoner` |

2. Obtén la llave SSH con la passphrase del paso 2. El comando de LG es `ares-novacom --device tv2021 --getkey` y pide la passphrase. **[No verificado en esta sesión: confirma el comando con `ares-novacom --help`.]**
3. Comprueba la conexión:

   ```bash
   ares-device-list
   ares-device-info --device tv2021
   ```

**Por qué:** `ares-install` y `ares-launch` usan el perfil para hablar con la TV. El perfil y la llave se guardan en la computadora, no en el repositorio.

## 6. Cuenta de servicio de Google (Drive)  [Verificado]

1. En Google Cloud Console, crea un proyecto (por ejemplo, `codetv`).
2. Habilita la **Google Drive API** en ese proyecto.
3. Crea una **cuenta de servicio** (por ejemplo, `codetv-drive`).
4. En esa cuenta, crea una **llave JSON** y descárgala.
5. Guárdala **fuera del repositorio**:

   ```bash
   mkdir -p ~/.config/codetv
   mv ~/Downloads/<archivo-de-la-llave>.json ~/.config/codetv/service-account.json
   chmod 600 ~/.config/codetv/service-account.json
   ```

6. Anota el correo de la cuenta de servicio: es el campo `client_email` del JSON (termina en `.iam.gserviceaccount.com`).

**Por qué:** la TV firma un token con esa llave para leer Drive. La llave es un secreto: quien la tenga puede leer lo que compartiste con la cuenta. Por eso va fuera del repositorio.

## 7. Compartir las carpetas de Drive  [Verificado]

1. En Google Drive, abre la carpeta que quieres que aparezca en la app.
2. Compártela con el `client_email` del paso 6, con permiso de **Lector**.
3. Repite para cada carpeta de la biblioteca.

**Por qué:** la app solo ve las carpetas compartidas con la cuenta de servicio. Esas carpetas son la biblioteca.

## 8. Verificar el acceso a Drive  [Verificado]

```bash
node scripts/drive-check.mjs ~/.config/codetv/service-account.json CodeTV-prueba
```

Debe listar los archivos de la carpeta indicada. Si falla con un error 403 o 404, revisa el paso 7.

**Por qué:** es la forma más rápida de separar un problema de Drive de un problema de la TV.

## 9. Proxy en la computadora  [Verificado]

El proxy entrega el video a la TV con la autorización de Drive, porque el reproductor de la TV no puede enviar cabeceras.

1. Genera un secreto para el proxy:

   ```bash
   openssl rand -hex 16
   ```

   Guárdalo; lo usarás en los pasos 10 y 13.
2. Anota la IP de la computadora en la red local:

   ```bash
   ipconfig getifaddr en0      # macOS
   ```

3. Arranca el proxy y déjalo corriendo mientras uses la TV:

   ```bash
   node server/proxy.mjs ~/.config/codetv/service-account.json <SECRETO> 8080
   ```

   Debe responder: `Proxy escuchando en el puerto 8080. Usa la IP local de tu Mac.`

**Por qué:** el proxy valida el secreto (parámetro `s=`) en cada petición, así nadie en la red puede usarlo sin él.

**No hagas esto:** no compartas el secreto en chats ni en repositorios. Si se expone, rótalo (sección 13.2).

## 10. Compilar y empaquetar la app  [Verificado]

Desde la carpeta del repositorio:

```bash
npm install
npm test
PROXY_BASE=http://<IP-de-la-computadora>:8080 PROXY_SECRET=<SECRETO> npm run package:tv
```

Resultado: `dist/com.diegodelacruz.codetv_<versión>_all.ipk`.

**Por qué:** `PROXY_BASE` y `PROXY_SECRET` se incluyen en la app para que la TV sepa dónde está el proxy. Por eso el paquete contiene el secreto y la llave: **no lo distribuyas ni lo subas a ningún repositorio**. `dist/` y `*.ipk` están en `.gitignore`.

## 11. Instalar y abrir la app en la TV  [Verificado]

```bash
ares-install --device tv2021 dist/com.diegodelacruz.codetv_0.1.0_all.ipk
ares-launch --device tv2021 com.diegodelacruz.codetv
```

Si la TV está apagada, la instalación falla con `EHOSTUNREACH` o `EHOSTDOWN`. Enciende la TV, verifica la IP (paso 3) y vuelve a intentar.

**Por qué:** `ares-install` copia el paquete y `ares-launch` lo abre. El identificador `com.diegodelacruz.codetv` está en `app/appinfo.json`.

## 12. Primer uso y verificación

1. Abre **Ajustes** en la app y revisa **Estado**: la biblioteca debe listar tus carpetas compartidas.
2. Si aparece el semáforo rojo en Ajustes, abre **Errores recientes**: cada registro explica qué pasó y qué hacer (ver [manual-usuario.md](manual-usuario.md), sección 6).
3. Reproduce un video de prueba para confirmar el proxy.

## 13. Mantenimiento

### 13.1 Reinstalar cuando caduca el modo desarrollador
1. Vuelve a activar el modo desarrollador (paso 2) y anota la passphrase nueva.
2. Actualiza la llave SSH si cambió (paso 5).
3. Vuelve a instalar (paso 11). **[No verificado]:** si los datos de la app (progreso, recientes, vistos) se conservan al reinstalar.

### 13.2 Rotar el secreto del proxy
1. Genera un secreto nuevo (paso 9).
2. Reinicia el proxy con el secreto nuevo.
3. Recompila con el `PROXY_SECRET` nuevo (paso 10) y reinstala (paso 11).

**Por qué:** el secreto va dentro del paquete instalado. Rotarlo invalida cualquier copia anterior.

### 13.3 Desinstalar la app  [No verificado]
```bash
ares-install --device tv2021 --remove com.diegodelacruz.codetv
```
Confirma el comando con `ares-install --help`.

## 14. Solución de problemas

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| `EHOSTUNREACH` / `EHOSTDOWN` al instalar | TV apagada o IP cambiada | Enciende la TV; revisa la IP (paso 3). |
| La app dice "Falta js/app.js" o "Falta js/service-account.js" | Paquete sin compilar o sin llave | Repite el paso 10. |
| "No hay conexión con el proxy" | Proxy apagado, IP cambiada o secreto distinto | Arranca el proxy (paso 9) y revisa la IP de `PROXY_BASE`. |
| Drive responde 403 | La carpeta no está compartida con la cuenta de servicio | Paso 7. |
| Drive responde 404 | El archivo o carpeta se movió o se eliminó | Pulsa recargar en Explorar. |
| "Formato no soportado por la TV" | Códec o contenedor no compatible | Convierte el archivo (MP4 H.264 + AAC, o MKV compatible). |
| La app desaparece de la TV | Caducó el modo desarrollador | Paso 13.1. |
| El proxy muestra `read ETIMEDOUT` | Drive cortó una descarga | El proxy sigue activo y registra el error; revisa la red de la computadora. |

## 15. Lista de verificación

- [ ] Cuenta de desarrollador LG creada.
- [ ] Modo desarrollador activo en cada TV; passphrase y tiempo anotados.
- [ ] IP de la TV con reserva DHCP.
- [ ] `@webos-tools/cli` instalada y `PATH` configurado.
- [ ] Perfil de la TV creado y llave SSH obtenida; `ares-device-info` responde.
- [ ] Proyecto de Google Cloud con la API de Drive habilitada.
- [ ] Llave de la cuenta de servicio en `~/.config/codetv/service-account.json` (permisos 600).
- [ ] Carpetas de Drive compartidas con el `client_email` como Lector.
- [ ] `drive-check.mjs` lista la carpeta de prueba.
- [ ] Proxy corriendo en la computadora con su secreto.
- [ ] Paquete generado con `PROXY_BASE` y `PROXY_SECRET`.
- [ ] App instalada y abierta en la TV; biblioteca visible en Ajustes → Estado.

## 16. Seguridad

- La llave de la cuenta de servicio y el secreto del proxy **no se versionan**: están fuera del repositorio o en `.gitignore`.
- El paquete `.ipk` contiene la llave y el secreto. Trátalo como un secreto.
- Rota el secreto si lo pegaste en un chat, un correo o un repositorio (sección 13.2).
- Uso previsto: personal, en una TV propia y en una red de confianza.
