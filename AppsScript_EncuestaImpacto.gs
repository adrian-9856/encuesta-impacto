/**
 * APPS SCRIPT — Encuesta "¿Qué es el impacto?" (nube de palabras)
 * -----------------------------------------------
 * Cada respuesta (1-2 palabras) se agrega como una caja de texto nueva
 * dentro de UNA SOLA diapositiva, en una posición y estilo variados,
 * simulando una "nube de palabras". No se crean diapositivas nuevas
 * ni presentaciones nuevas por cada respuesta.
 *
 * La primera vez que alguien responde, el script CREA la presentación
 * automáticamente (no necesitas tenerla creada de antemano) y guarda
 * su ID para seguir usando la misma en todas las respuestas siguientes.
 *
 * INSTRUCCIONES DE INSTALACIÓN (una sola vez, ~5 minutos):
 * 1. Ve a https://script.google.com y crea un "Nuevo proyecto".
 * 2. Borra el contenido de Code.gs y pega TODO este archivo.
 * 3. Guarda el proyecto (ícono de disquete). Ponle un nombre, ej: "Encuesta Impacto".
 * 4. Arriba a la derecha: "Implementar" → "Nueva implementación".
 * 5. Haz clic en el ícono de engranaje junto a "Seleccionar tipo" → elige "Aplicación web".
 * 6. Configura:
 *      - Descripción: (lo que quieras)
 *      - Ejecutar como: "Yo" (tu cuenta)
 *      - Quién tiene acceso: "Cualquier usuario"
 * 7. Haz clic en "Implementar". Google te pedirá autorizar permisos (Slides + Drive) — acepta.
 * 8. Copia la "URL de la aplicación web" que te da (termina en /exec).
 * 9. Pega esa URL en la constante WEB_APP_URL dentro del archivo HTML de la encuesta.
 *
 * Si más adelante modificas este código, debes volver a "Implementar" →
 * "Gestionar implementaciones" → editar (ícono de lápiz) → "Nueva versión" → Implementar,
 * para que los cambios entren en efecto sin cambiar la URL.
 *
 * IMPORTANTE: si vienes de una versión anterior (una diapositiva por
 * respuesta, o selección única), ejecuta UNA VEZ manualmente la función
 * reiniciarEncuesta() antes de volver a probar, para arrancar con una
 * presentación limpia de una sola diapositiva.
 */

var PREGUNTA = '¿Qué es para ti el impacto?';
var COLORES = ['#1A1A1A', '#3B3B3B', '#5C5C5C', '#787878'];

function doPost(e) {
  try {
    var respuesta = (e.parameter.respuesta || '').toString().trim();
    if (!respuesta) {
      return jsonOutput({ ok: false, error: 'Respuesta vacía' });
    }
    // Nos aseguramos de no agregar más de 2 palabras, aunque llegue más texto.
    var frase = respuesta.split(/\s+/).slice(0, 2).join(' ');

    var props = PropertiesService.getScriptProperties();
    var presId = props.getProperty('PRESENTATION_ID');
    var presentation;

    if (!presId) {
      presentation = SlidesApp.create('Presentacion');
      props.setProperty('PRESENTATION_ID', presentation.getId());
      buildWordCloudSlide(presentation);
    } else {
      presentation = SlidesApp.openById(presId);
    }

    addWordToCloud(presentation, frase);

    return jsonOutput({ ok: true, presentationUrl: presentation.getUrl() });

  } catch (err) {
    return jsonOutput({ ok: false, error: err.message });
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('El servicio de la encuesta está activo. Envía respuestas por POST.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Crea la única diapositiva de la nube de palabras, con la pregunta como título. */
function buildWordCloudSlide(presentation) {
  var placeholder = presentation.getSlides()[0];
  var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  placeholder.remove();

  var pageWidth = presentation.getPageWidth();
  var titleBox = slide.insertTextBox(PREGUNTA, 40, 20, pageWidth - 80, 50);
  titleBox.getText().getTextStyle().setFontSize(22).setBold(true);
}

/** Agrega una frase (1-2 palabras) a la nube, en posición y estilo aleatorios. */
function addWordToCloud(presentation, frase) {
  var slide = presentation.getSlides()[0];
  var pageWidth = presentation.getPageWidth();
  var pageHeight = presentation.getPageHeight();

  var areaTop = 90;
  var boxWidth = 180;
  var boxHeight = 45;

  var x = Math.random() * (pageWidth - boxWidth - 40) + 20;
  var y = areaTop + Math.random() * (pageHeight - areaTop - boxHeight - 20);

  var box = slide.insertTextBox(frase, x, y, boxWidth, boxHeight);
  var style = box.getText().getTextStyle();
  var tamano = 14 + Math.floor(Math.random() * 20); // 14–34
  style.setFontSize(tamano);
  style.setBold(Math.random() > 0.5);
  style.setForegroundColor(COLORES[Math.floor(Math.random() * COLORES.length)]);
  box.setRotation(Math.round(Math.random() * 20 - 10)); // -10° a 10°
}

/**
 * Ejecuta esto UNA VEZ manualmente (menú de funciones arriba en el editor →
 * elige "reiniciarEncuesta" → botón Ejecutar) si vienes de una versión
 * anterior o quieres empezar la nube de palabras desde cero.
 * NO borra el archivo viejo de Drive (eso lo borras tú manualmente si quieres).
 */
function reiniciarEncuesta() {
  PropertiesService.getScriptProperties().deleteProperty('PRESENTATION_ID');
  Logger.log('Referencia borrada. La próxima respuesta creará una presentación nueva.');
}

/**
 * Función opcional: ejecútala manualmente una vez si quieres crear la
 * presentación de una vez, antes de recibir respuestas.
 */
function crearPresentacionManualmente() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('PRESENTATION_ID')) {
    Logger.log('Ya existe una presentación: ' + SlidesApp.openById(props.getProperty('PRESENTATION_ID')).getUrl());
    return;
  }
  var presentation = SlidesApp.create('Presentacion');
  props.setProperty('PRESENTATION_ID', presentation.getId());
  buildWordCloudSlide(presentation);
  Logger.log('Presentación creada: ' + presentation.getUrl());
}
