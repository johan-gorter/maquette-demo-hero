'use strict';

var maquette = require('maquette');
var velocity = require('velocity-animate');
var createHeroManager = require('./hero-manager');

var h = maquette.h;

var focussedId = null;
var items = [
  {id: 1, title: 'Lorem'},
  {id: 2, title: 'ipsum'},
  {id: 3, title: 'dolor'},
  {id: 4, title: 'sit'},
  {id: 5, title: 'amet'}
  // adipiscing elit
];

// The object managing the hero transitions
var heroManager = createHeroManager();

var colorFor = function(name) {
  return 'background-color:hsl(' + (name.charCodeAt(0) * 360 / 20) + ',75%,50%)';
};

// The animations

var enterItem = function(element) {
  heroManager.registerEnteringHeroes(element);
  element.style.height = '0px';
  velocity.animate(element, {height: '40px'}, 350, 'ease-in-out', function() {element.style.height = '';});
  for (var i=0;i < element.childNodes.length;i++) {
    var childNode = element.childNodes[i];
    childNode.style.transform = 'scaleY(0)';
    velocity.animate(childNode, {scaleY: [1,0]}, 350, 'ease-in-out');
  }
};

var exitItem = function(element, removeElement) {
  heroManager.registerExitingHeroes(element, null);
  velocity.animate(element, {height: '0px'}, 350, 'ease-in-out', removeElement);
  for (var i=0;i < element.childNodes.length;i++) {
    var childNode = element.childNodes[i];
    velocity.animate(childNode, {scaleY: '0'}, 350, 'ease-in-out');
  }
};

var fadeOutPage = function(element, removeElement) {
  element.style.position = 'absolute';
  element.style.top = '0';
  element.style.zIndex = '-2';
  heroManager.registerExitingHeroes(element, undefined);
  velocity.animate(element, {opacity: 0}, {delay: 200, duration:500, easing:'ease-out', complete: removeElement});
};

var fadeIn = function(element) {
  // This function will be passed to the hero-manager as the pageEnter animation.
  element.style.opacity = "0";
  velocity.animate(element, {opacity: 1}, {delay: 200, duration:500, easing:"ease-out", complete: function() {
    element.style.opacity = "";
  }});  
};

var fadeInPage = function(element) {
  heroManager.registerEnterPage(element, fadeIn);
};

// The Virtual DOM

function renderMaquette() {
  return h('div.center', {afterUpdate: heroManager.execute}, [
    focussedId ? [
      h('div.detail', {enterAnimation: fadeInPage, exitAnimation: fadeOutPage}, [
        items.map(function(item){
          if (item.id === focussedId) {
            return [
              h('div.title-background'),
              h('div.image', {'data-hero-id': 'item-image-'+item.id, style:colorFor(item.title)}, [item.title.substr(0,1)]),
              h('div.title', {'data-hero-id': 'item-title-'+item.id}, [item.title]),
              h('div.content', ['Lorem ipsum dolor sit amet'])
            ];
          }
        })
      ])
    ] : [
      h('div.list', {enterAnimation: fadeInPage, exitAnimation: fadeOutPage}, [
        items.map(function(item) {
          return h('div.item', {key: item.id, enterAnimation: enterItem, exitAnimation: exitItem}, [
            h('div.image', {'data-hero-id': 'item-image-'+item.id, style:colorFor(item.title)}, [item.title.substr(0,1)]),
            h('div.title', {'data-hero-id': 'item-title-'+item.id}, [item.title])
          ]);
        })
      ])
    ]
  ]);
}

var projector = maquette.createProjector();
projector.append(document.body, renderMaquette);


// The autonomic script that is executed continuously
var scriptIndex = 0;
var originalItems = items.slice();

var script = [
  function() {
    focussedId = 4;
  },
  function() {
    focussedId = undefined;
  },
  function() {
    // swap 2 items
    var item1 = items[1];
    var item3 = items[3];
    items[1] = item3;
    items[3] = item1;
  },
  function() {
    // move one item
    var item1 = items[1];
    items.splice(1,1);
    items.splice(3, 0, item1);
  },
  function() {
    focussedId = 2;
  },
  function() {
    focussedId = null;
  },
  function() {
    // add one item
    items.splice(2, 0, {id: 6, title: 'consectetur'});
  },
  function() {
    // remove one item
    items.splice(4, 1);
  },
  function(){
    items = originalItems.slice();
  }
];

var nextStep = function() {
  script[scriptIndex]();
  scriptIndex++;
  if (!script[scriptIndex]) {
    scriptIndex = 0;
  }
  projector.scheduleRender();
  setTimeout(nextStep, 1000);
};

setTimeout(nextStep, 500);
