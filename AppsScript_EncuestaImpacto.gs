/**
 * APPS SCRIPT — Encuesta "¿Qué es el impacto?"
 * -----------------------------------------------
 * Este script recibe cada respuesta enviada desde la página HTML
 * y la agrega como una diapositiva nueva en una presentación de Google Slides.
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
 */

function doPost(e) {
  try {
    var respuesta = (e.parameter.respuesta || '').toString().trim();
    if (!respuesta) {
      return jsonOutput({ ok: false, error: 'Respuesta vacía' });
    }

    var props = PropertiesService.getScriptProperties();
    var presId = props.getProperty('PRESENTATION_ID');
    var presentation;

    if (!presId) {
      presentation = SlidesApp.create('Presentacion');
      presId = presentation.getId();
      props.setProperty('PRESENTATION_ID', presId);
    } else {
      presentation = SlidesApp.openById(presId);
    }

    var pageWidth = presentation.getPageWidth();
    var pageHeight = presentation.getPageHeight();

    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);

    var textBox = slide.insertTextBox(
      respuesta,
      50, 60,
      pageWidth - 100, pageHeight - 160
    );
    var style = textBox.getText().getTextStyle();
    style.setFontSize(24);
    style.setFontFamily('Georgia');

    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
    var footer = slide.insertTextBox(timestamp, 50, pageHeight - 60, 300, 30);
    footer.getText().getTextStyle().setFontSize(10).setForegroundColor('#888888');

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

/**
 * Ejecuta esto UNA VEZ manualmente si quieres borrar la referencia guardada
 * y que la próxima respuesta cree una presentación nueva desde cero.
 * NO borra el archivo viejo de Drive (eso lo borras tú manualmente si quieres).
 */
function reiniciarEncuesta() {
  PropertiesService.getScriptProperties().deleteProperty('PRESENTATION_ID');
  Logger.log('Referencia borrada. La próxima respuesta creará una presentación nueva.');
}

/**
 * Función opcional: ejecútala manualmente una vez si quieres obtener
 * de inmediato el link de la presentación antes de recibir respuestas.
 */
function crearPresentacionManualmente() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('PRESENTATION_ID')) {
    Logger.log('Ya existe una presentación: ' + SlidesApp.openById(props.getProperty('PRESENTATION_ID')).getUrl());
    return;
  }
  var presentation = SlidesApp.create('Presentacion');
  props.setProperty('PRESENTATION_ID', presentation.getId());
  Logger.log('Presentación creada: ' + presentation.getUrl());
}
