'use strict';

var maquette = require("maquette");
var velocity = require("velocity-animate");

var h = maquette.h;

var focussedId = null;
var items = [
  {id: 1, title: "Lorem"},
  {id: 2, title: "ipsum"},
  {id: 3, title: "dolor"},
  {id: 4, title: "sit"},
  {id: 5, title: "amet"}
  // adipiscing elit
];

var enterItem = function(element) {
  heroManager.registerEnteringHeroes(element);
  element.style.height = "0px";
  velocity.animate(element, {height: "40px"}, 350, "ease-in-out", function() {element.style.height = "";});
  for (var i=0;i < element.childNodes.length;i++) {
    var childNode = element.childNodes[i];
    childNode.style.transform = "scaleY(0)";
    velocity.animate(childNode, {scaleY: [1,0]}, 350, "ease-in-out");
  }
};

var exitItem = function(element, removeElement) {
  heroManager.registerExitingHeroes(element, null);
  velocity.animate(element, {height: "0px"}, 350, "ease-in-out", removeElement);
  for (var i=0;i < element.childNodes.length;i++) {
    var childNode = element.childNodes[i];
    velocity.animate(childNode, {scaleY: "0"}, 350, "ease-in-out");
  }
};

var fadeOutPage = function(element, removeElement) {
  element.style.position = "absolute";
  element.style.top = "0";
  element.style.zIndex = "-2";
  heroManager.registerExitingHeroes(element, undefined);
  for (var i=0;i < element.childNodes.length;i++) {
    var childNode = element.childNodes[i];
    velocity.animate(childNode, {opacity: 0}, {delay: 200, duration:500, easing:"ease-out", complete: removeElement});
  }
};

var fadeInPage = function(element) {
  heroManager.registerEnteringHeroes(element);
  for (var i=0;i < element.childNodes.length;i++) {
    (function(){
      var childNode = element.childNodes[i];
      childNode.style.opacity = "0";
      velocity.animate(childNode, {opacity: 1}, {delay: 200, duration:500, easing:"ease-out", complete: function() {
        childNode.style.opacity = "";
      }});
    }());
  }
};

var createHeroManager= function() {
  var addedHeroes = {}; // id -> Element
  var removedHeroes = {}; // id -> {element, rect}
  var fadeInElements = [];
  
  var fadeIn = function(element) {
    element.style.opacity = "0";
    velocity.animate(element, {opacity: 1}, {delay: 200, duration:500, easing:"ease-out", complete: function() {
      element.style.opacity = "";
    }});
  };
  
  var fadeInChildrenExceptHeroes = function(element, fadeInParent, heroes) {
    for (var i=0;i<element.childNodes.length;i++) {
      var child = element.childNodes[i];
      var action = "fadeIn";
      heroes.forEach(function(hero) {
        if (action === "fadeIn") {
          if (hero === child) {
            action = null;
          } else {
            var heroParent = hero.parentNode;
            while (heroParent!==fadeInParent) {
              if (heroParent === child) {
                action = "fadeInChildren";
                return;
              }
              heroParent = heroParent.parentNode;
            }
          }
        }
      });
      if (action === "fadeIn") {
        fadeIn(child);
      } else if (action === "fadeInChildren") {
        fadeInChildrenExceptHeroes(child, fadeInParent, heroes);
      }
    }
  };

  var heroManager = {
    registerExitingHeroes: function(exitingElement, removeExitingElement) {
      var heroes = exitingElement.querySelectorAll("*[data-hero-id]");
      for (var i=0;i<heroes.length;i++) {
        var hero = heroes[i];
        var heroId = hero.getAttribute("data-hero-id");
        removedHeroes[heroId] = {
          element: hero,
          rect: hero.getBoundingClientRect()
        };
      }
      if (removeExitingElement) {
        removeExitingElement();
      }
    },
    registerEnteringHeroes: function(enteringElement, fadeInParent) {
      var heroes = enteringElement.querySelectorAll("*[data-hero-id]");
      for (var i=0;i<heroes.length;i++) {
        var hero = heroes[i];
        var heroId = hero.getAttribute("data-hero-id");
        addedHeroes[heroId] = {element: hero, fadeInParent: fadeInParent};
      }
    },
    registerFadeIn: function(enteringElement) {
      fadeInElements.push(enteringElement);
      heroManager.registerEnteringHeroes(enteringElement, enteringElement);
    },
    reconstructMoves: function() {
      var matchedAddedHeroes = [];
      Object.keys(addedHeroes).forEach(function(heroId) {
        var exitingHero = removedHeroes[heroId];
        if (exitingHero) {
          matchedAddedHeroes.push(addedHeroes[heroId]);
          var enteringHeroElement = addedHeroes[heroId].element;
          exitingHero.element.style.visibility = "hidden";
          var newRect = enteringHeroElement.getBoundingClientRect();
          velocity.animate(enteringHeroElement, "stop");
          enteringHeroElement.style.opacity = "1";
          var dx = newRect.left - exitingHero.rect.left;
          var dy = newRect.top - exitingHero.rect.top;
          enteringHeroElement.style.transform = "translateX("+(-dx)+"px) translateY("+(-dy)+"px)";
          velocity.animate(enteringHeroElement,{translateX: [0, -dx], translateY: [0, -dy]}, 350, "ease-in-out", function() {
            enteringHeroElement.style.transition = "";
          });
        }
      });
      fadeInElements.forEach(function(fadeInParent) {
        var heroes = [];
        matchedAddedHeroes.forEach(function(addedHero) {
          if (addedHero.fadeInParent === fadeInParent) {
            heroes.push(addedHero.element);
          }
        });
        if (heroes.length === 0) {
          fadeIn(fadeInParent);
        } else {
          fadeInChildrenExceptHeroes(fadeInParent, fadeInParent, heroes);
        }
      });
      
      fadeInElements = [];
      addedHeroes = {};
      removedHeroes = {};
    }
  };
  return heroManager;
};

var colorFor = function(name) {
  return "background-color:hsl(" + (name.charCodeAt(0) * 360 / 20) + ",75%,50%)";
};

var heroManager = createHeroManager();

function renderMaquette() {
  return h("body", [
    h("div.center", {afterUpdate: heroManager.reconstructMoves}, [
      focussedId ? [
        h("div.detail", {enterAnimation: heroManager.registerFadeIn, exitAnimation: fadeOutPage}, [
          items.map(function(item){
            if (item.id === focussedId) {
              return [
                h("div.title-background"),
                h("div.image", {"data-hero-id": "item-image-"+item.id, style:colorFor(item.title)}, [item.title.substr(0,1)]),
                h("div.title", {"data-hero-id": "item-title-"+item.id}, [item.title]),
                h("div.content", ["Lorem ipsum dolor sit amet"])
              ];
            }
          })
        ])
      ] : [
        h("div.list", {enterAnimation: heroManager.registerFadeIn, exitAnimation: fadeOutPage}, [
          items.map(function(item) {
            return h("div.item", {key: item.id, enterAnimation: enterItem, exitAnimation: exitItem}, [
              h("div.image", {"data-hero-id": "item-image-"+item.id, style:colorFor(item.title)}, [item.title.substr(0,1)]),
              h("div.title", {"data-hero-id": "item-title-"+item.id}, [item.title])
            ]);
          })
        ])
      ]
    ])
  ]);
}

var projector = maquette.createProjector(document.body, renderMaquette);

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
    items.splice(2, 0, {id: 6, title: "consectetur"});
  },
  function() {
    // remove one item
    items.splice(4, 1);
  },
  function(){
    items = originalItems.slice();
  }
];
var scriptIndex = 0;
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
