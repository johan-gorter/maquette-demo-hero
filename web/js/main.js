'use strict';

var maquette = require("maquette");

var h = maquette.h;

var renderMaquette = function() {
  return h("body", ["TODO"]);
};

var projector = maquette.createProjector(document.body, renderMaquette);
