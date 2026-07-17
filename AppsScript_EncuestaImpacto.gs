/**
 * APPS SCRIPT — Encuesta "¿Qué es el impacto?" (selección única + gráfico de dona)
 * -----------------------------------------------
 * Recibe la OPCIÓN elegida desde la página HTML, suma 1 al conteo de esa
 * opción en una Google Sheet oculta, y refresca un gráfico de dona insertado
 * en una diapositiva de Google Slides con el acumulado de todas las respuestas.
 *
 * La primera vez que alguien responde, el script CREA automáticamente:
 *  - una Google Sheet ("Datos — Encuesta Impacto") con el conteo por opción
 *  - una presentación de Google Slides ("Presentacion") con la pregunta,
 *    la lista de opciones, y el gráfico de dona conectado a la Sheet
 *
 * IMPORTANTE: OPTIONS debe ser EXACTAMENTE igual (mismo texto, letra por
 * letra) a las opciones definidas en el <form> de index.html.
 *
 * INSTRUCCIONES DE INSTALACIÓN: igual que siempre (ver README) — pega este
 * archivo completo en Code.gs, Implementar → Aplicación web, copia la URL /exec.
 *
 * Si ya habías probado una versión anterior (respuesta libre) y quieres
 * empezar de cero con este sistema nuevo, ejecuta UNA VEZ manualmente la
 * función reiniciarEncuesta() (ver más abajo) antes de volver a probar.
 */

var QUESTION = '¿Qué es para ti el impacto?';
var OPTIONS = [
  'Ayudar a otras personas',
  'Generar un cambio duradero',
  'Dejar un legado',
  'Crecer y aprender'
];

function doPost(e) {
  try {
    var respuesta = (e.parameter.respuesta || '').toString().trim();
    var match = OPTIONS.filter(function (o) {
      return o.toLowerCase() === respuesta.toLowerCase();
    })[0];

    if (!match) {
      return jsonOutput({ ok: false, error: 'Opción inválida: ' + respuesta });
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(15000);
    var presentationUrl;
    try {
      var setup = ensureSetup();
      var rowIndex = OPTIONS.indexOf(match) + 2; // fila 1 = encabezado
      var cell = setup.sheet.getRange(rowIndex, 2);
      cell.setValue(cell.getValue() + 1);
      SpreadsheetApp.flush();

      refreshChart(setup.presentation);
      presentationUrl = setup.presentation.getUrl();
    } finally {
      lock.releaseLock();
    }

    return jsonOutput({ ok: true, presentationUrl: presentationUrl });

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
 * Crea (si no existen) la Sheet de conteo y la presentación con la pregunta,
 * las opciones y el gráfico de dona. Si ya existen, solo las abre.
 */
function ensureSetup() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty('SPREADSHEET_ID');
  var presId = props.getProperty('PRESENTATION_ID');

  var ss;
  if (!ssId) {
    ss = SpreadsheetApp.create('Datos — Encuesta Impacto');
    var sheet = ss.getActiveSheet();
    sheet.setName('Conteo');
    sheet.getRange(1, 1, 1, 2).setValues([['Opcion', 'Votos']]);
    var rows = OPTIONS.map(function (o) { return [o, 0]; });
    sheet.getRange(2, 1, rows.length, 2).setValues(rows);
    props.setProperty('SPREADSHEET_ID', ss.getId());
  } else {
    ss = SpreadsheetApp.openById(ssId);
  }
  var sheet = ss.getSheetByName('Conteo');

  var presentation;
  if (!presId) {
    presentation = SlidesApp.create('Presentacion');
    props.setProperty('PRESENTATION_ID', presentation.getId());
    buildPollSlide(presentation, sheet);
  } else {
    presentation = SlidesApp.openById(presId);
  }

  return { ss: ss, sheet: sheet, presentation: presentation };
}

/**
 * Construye la diapositiva única: pregunta + opciones a la izquierda,
 * gráfico de dona (conectado a la Sheet) a la derecha.
 */
function buildPollSlide(presentation, sheet) {
  var pageWidth = presentation.getPageWidth();
  var pageHeight = presentation.getPageHeight();

  // La presentación nace con una diapositiva de plantilla (con placeholders);
  // la reemplazamos por una en blanco para controlar el diseño nosotros.
  var placeholder = presentation.getSlides()[0];
  var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  placeholder.remove();

  var titleBox = slide.insertTextBox(QUESTION, 40, 30, pageWidth - 80, 70);
  titleBox.getText().getTextStyle().setFontSize(26).setBold(true);

  var optionsText = OPTIONS.map(function (o, i) {
    return (i + 1) + '. ' + o;
  }).join('\n');
  var optionsBox = slide.insertTextBox(optionsText, 40, 120, pageWidth / 2 - 60, pageHeight - 160);
  optionsBox.getText().getTextStyle().setFontSize(16);

  var chart = sheet.newChart()
    .asPieChart()
    .addRange(sheet.getRange(1, 1, OPTIONS.length + 1, 2))
    .setOption('pieHole', 0.5)
    .setOption('title', QUESTION)
    .setOption('legend', { position: 'bottom' })
    .setPosition(1, 1, 0, 0)
    .build();
  sheet.insertChart(chart);

  var slideChart = slide.insertSheetsChart(
    chart,
    pageWidth / 2 + 10, 120, pageWidth / 2 - 50, pageHeight - 160
  );

  PropertiesService.getScriptProperties().setProperty('CHART_ID', slideChart.getObjectId());
}

/** Refresca el gráfico de dona en la diapositiva con los datos actuales de la Sheet. */
function refreshChart(presentation) {
  var chartId = PropertiesService.getScriptProperties().getProperty('CHART_ID');
  if (!chartId) return;

  var slide = presentation.getSlides()[0];
  var elements = slide.getPageElements();
  for (var i = 0; i < elements.length; i++) {
    if (elements[i].getObjectId() === chartId) {
      elements[i].asSheetsChart().refresh();
      return;
    }
  }
}

/**
 * Ejecuta esto UNA VEZ manualmente (menú de funciones arriba en el editor →
 * elige "reiniciarEncuesta" → botón Ejecutar) si vienes de la versión
 * anterior (respuesta libre) o si cambiaste las OPTIONS y quieres empezar
 * de cero. Borra las referencias guardadas; NO borra los archivos viejos
 * de Drive (esos los borras tú manualmente si quieres).
 */
function reiniciarEncuesta() {
  var props = PropertiesService.getScriptProperties();
  props.deleteProperty('SPREADSHEET_ID');
  props.deleteProperty('PRESENTATION_ID');
  props.deleteProperty('CHART_ID');
  Logger.log('Referencias borradas. La próxima respuesta creará Sheet y Presentación nuevas.');
}

/**
 * Función opcional: ejecútala manualmente si quieres crear la Sheet y la
 * presentación de una vez, antes de recibir respuestas.
 */
function crearPresentacionManualmente() {
  var setup = ensureSetup();
  Logger.log('Presentación: ' + setup.presentation.getUrl());
  Logger.log('Hoja de datos: ' + setup.ss.getUrl());
}
