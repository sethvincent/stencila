'use strict';

var Raven = require('raven-js');

var Component = require('substance/ui/Component');
var $ = window.$ = require('substance/util/jquery');
var SheetWriter = require('./ui/SheetWriter');
var SheetHTMLImporter = require('./model/SheetHTMLImporter');
var SheetHTMLExporter = require('./model/SheetHTMLExporter');

var SheetRemoteEngine = require('./engine/SheetRemoteEngine');
var engine = new SheetRemoteEngine();

function loadDocument() {
  var content = $('#content');
  var html = content.html() || '';
  document.body.innerHTML = '';

  var importer = new SheetHTMLImporter();
  var doc = importer.importDocument(html);
  // Expose doc for debugging in the console
  window.doc = doc;
  return doc;
}

function activateSession(cb) {
  console.log('booting session');
  engine.boot(function(err, res) {
    console.log('boot.res', res);
    cb();
  });
}

// At some point this may run on the server
function renderStaticReadonlyVersion(doc) {
  var ghostEl = document.createElement('div');
  Component.mount(SheetWriter, {
    mode: 'read',
    doc: doc
  }, ghostEl);
  document.body.innerHTML = ghostEl.innerHTML;
}

function renderInteractiveVersion(doc, mode) {
  document.body.innerHTML = '';
  Component.mount(SheetWriter, {
    mode: mode,
    doc: doc,
    engine: engine,
    onSave: function(doc, changes, cb) {
      var exporter = new SheetHTMLExporter();
      var html = exporter.exportDocument(doc);
      engine.save(html);
    }
  }, document.body);
}

window.Stencila = {};
window.isEditable = true;

function launch() {
  Raven
    .config(
      'https://6329017160394100b21be92165555d72@app.getsentry.com/37250',{
        ignoreUrls: [
          // Ignore errors generated during development or on local sessions
          /localhost/,
          /127\.0\.0\.1/,
        ]
      })
    .install();
  try {
    var doc = loadDocument();
    if (window.isEditable) {
      renderStaticReadonlyVersion(doc);
      activateSession(function(err) {
        if (err) throw new Error(err);
        renderInteractiveVersion(doc, 'write');
      });
    } else {
      renderInteractiveVersion(doc, 'read');
    }
  } catch(e) {
    Raven.captureException(e)
  }
}

window.activate = function() {
  engine.activate();
}

window.deactivate = function() {
  engine.deactivate();
}

$(launch);
