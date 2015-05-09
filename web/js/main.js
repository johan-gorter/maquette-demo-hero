'use strict';

var maquette = require("maquette");

var h = maquette.h;

function renderMaquette() {
  return h("body", [
    "TODO"
  ]);
}

var projector = maquette.createProjector(document.body, renderMaquette);
