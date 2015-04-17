'use strict';

var maquette = require("maquette");

var h = maquette.h;

var cols = ["Naam", "Adres", "Woonplaats", "Land", "E-Mail", "Telefoonnummer"];
var rows = [
  ["Pietje Puk", "Nergens", "Platteland", "Verweggistan", "", ""],
  ["Marietje Puk", "Nergens", "Platteland", "Verweggistan", "", ""]
];

for (var i=0;i<14;i++) {
  rows.push(rows[0]);
  rows.push(rows[1]);
}

function selectElementContents(el) {
  var range = document.createRange();
  range.selectNodeContents(el);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

var cellFocus = function(evt) {
  var cell = evt.currentTarget;
  selectElementContents(cell);
};

var hscroll = function(evt) {
  scrollLeft = evt.target.scrollLeft;
};

var scrollLeft = 0;
var tableRect = null;
var windowHeight = null;

var handleWindowScroll = function(evt) {
  measure();
  projector.scheduleRender();
};

var afterCreate = function(element) {
  measure();
  projector.scheduleRender();
};

var measure = function() {
  tableRect = document.querySelector("table").getBoundingClientRect();
  windowHeight = window.innerHeight;
};

function renderMaquette() {
  var fixedHeader = tableRect && (tableRect.top < 0 && tableRect.bottom > 40);
  var fixedBottomScroller = tableRect && (tableRect.bottom > windowHeight);
  return h("body", [
    h("div.debug", [
      h("p#1", ["tableTop: ", tableRect?""+tableRect.top:""]),
      h("p#2", ["tableBottom: ", tableRect?""+tableRect.bottom:""]),
      h("p#3", ["windowHeight: ", ""+windowHeight]),
      h("p#4", ["fixedHeader: ", ""+fixedHeader]),
      h("p#5", ["fixedScroller: ", ""+fixedBottomScroller]),
    ]),
    h("div.outer", [
      h("table", {afterCreate: afterCreate}, [
        h("thead", { classes: {fixedHeader: fixedHeader}}, [
          h("tr", {style: "left:-"+scrollLeft+"px"}, [
            cols.map(function(col, index) {
              return h("th", {key: index}, [col]);
            })
          ])
        ]),
        h("tbody", { onscroll: hscroll, scrollLeft: scrollLeft }, [
          rows.map(function(row, rowIndex) {
            return h("tr", {key:rowIndex}, [
              row.map(function(cell, colIndex) {
                if (colIndex === 0) {
                  return h("th.h-fixed-outer", {key:colIndex, tabIndex: "0", onfocus: cellFocus}, [h("span.h-fixed", [cell])]);
                } else {
                  return h(colIndex === 0 ? "th" : "td", {key:colIndex, tabIndex: "0", onfocus: cellFocus}, [cell]);
                }
              })
            ]);
          })
        ])
      ]),
      fixedBottomScroller ? [
        h("div.scroller", {onscroll: hscroll, scrollLeft: scrollLeft}, [h("div.width")])
      ]: []
    ]),
    rows.map(function(row){
      return h("p", {key:row}, ["More content"]);
    })
  ]);
}

var projector = maquette.createProjector(document.body, renderMaquette);

window.addEventListener("scroll", handleWindowScroll);
