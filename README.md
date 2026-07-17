# Encuesta — ¿Qué es para ti el impacto?

Página de una sola pregunta que muestra un video de agradecimiento al responder,
y envía cada respuesta como una diapositiva nueva a una presentación de Google Slides.

## Archivos

- **index.html** — la página que ven las personas (pregunta, campo de respuesta, video, animación).
- **AppsScript_EncuestaImpacto.gs** — el código que va en Google Apps Script (NO se sube a ningún servidor tuyo, vive dentro de tu cuenta de Google).

## Paso 1 — Configurar Google Apps Script (una sola vez)

1. Ve a https://script.google.com → "Nuevo proyecto".
2. Borra el contenido de `Code.gs` y pega TODO el contenido de `AppsScript_EncuestaImpacto.gs`.
3. Guarda el proyecto (ícono de disquete), ponle un nombre (ej: "Encuesta Impacto").
4. Arriba a la derecha: **Implementar → Nueva implementación**.
5. Clic en el ícono de engranaje junto a "Seleccionar tipo" → elige **Aplicación web**.
6. Configura:
   - Ejecutar como: **Yo** (tu cuenta)
   - Quién tiene acceso: **Cualquier usuario**
7. Clic en **Implementar**. Autoriza los permisos que pida (Slides + Drive).
8. Copia la URL que termina en `/exec`.

Si más adelante editas el script, debes volver a implementar (Gestionar implementaciones → editar → Nueva versión → Implementar) para que los cambios entren en efecto sin cambiar la URL.

## Paso 2 — Conectar la página con el script

Abre `index.html` en VS Code, busca esta línea (cerca del final, en el `<script>`):

```js
const WEB_APP_URL = "PEGA_AQUI_TU_URL_DE_APPS_SCRIPT";
```

Reemplaza el texto entre comillas con la URL que copiaste en el paso 1. Guarda el archivo.

## Paso 3 — Cambiar el video (opcional)

El video actual es el que compartiste. Si quieres cambiarlo, busca esta línea:

```js
const YOUTUBE_VIDEO_ID = "N5K0OKnwc1c";
```

Reemplaza `N5K0OKnwc1c` por el ID del nuevo video (la parte de la URL de YouTube después de `v=`).

## Paso 4 — Probar localmente

YouTube no reproduce videos embebidos si abres el archivo directamente con doble clic (`file://`).
Para probarlo en tu computadora:

1. Abre una terminal en esta carpeta.
2. Ejecuta:
   ```
   python -m http.server 8000
   ```
3. Abre en el navegador: `http://localhost:8000`

## Paso 5 — Publicarlo para que otros respondan

`localhost` solo funciona en tu computadora. Para que cualquier persona pueda responder desde su celular, sube la carpeta a un lugar público, por ejemplo:

- **Netlify Drop** (más simple, sin cuenta): https://app.netlify.com/drop — arrastra esta carpeta completa.
- **GitHub Pages** si ya usas Git/GitHub.

Una vez publicado, comparte el link que te den (por WhatsApp, QR, etc.).

## Dónde quedan las respuestas

Cada respuesta enviada crea una diapositiva nueva en una presentación de Google Slides llamada
**"Presentacion"**, que se crea automáticamente en tu Google Drive la primera vez
que alguien responde.

## Si quieres empezar de cero

Ejecuta manualmente la función `reiniciarEncuesta()` desde el editor de Apps Script (selecciónala
en el menú desplegable de funciones arriba y presiona "Ejecutar"). Esto borra la referencia
guardada para que la próxima respuesta cree una presentación nueva desde cero. No borra el
archivo viejo de Drive — eso lo borras tú manualmente si quieres.
