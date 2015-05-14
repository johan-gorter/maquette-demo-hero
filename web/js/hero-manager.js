'use strict';

var velocity = require('velocity-animate');

var createHeroManager= function() {
  var addedHeroes = {}; // id -> Element
  var removedHeroes = {}; // id -> {element, rect}
  var enterPages = [];
  
  var animateChildrenExceptHeroes = function(element, animateParent, heroes, animation) {
    for (var i=0;i<element.childNodes.length;i++) {
      var child = element.childNodes[i];
      var action = 'animate';
      heroes.forEach(function(hero) {
        if (action === 'animate') {
          if (hero === child) {
            action = null;
          } else {
            var heroParent = hero.parentNode;
            while (heroParent!==animateParent) {
              if (heroParent === child) {
                action = 'animateChildren';
                return;
              }
              heroParent = heroParent.parentNode;
            }
          }
        }
      });
      if (action === 'animate') {
        animation(child);
      } else if (action === 'animateChildren') {
        animateChildrenExceptHeroes(child, animateParent, heroes, animation);
      }
    }
  };

  var heroManager = {
    registerExitingHeroes: function(exitingElement, removeExitingElement) {
      // the exitingElement is searched for hero elements that are removed
      var heroes = exitingElement.querySelectorAll('*[data-hero-id]');
      for (var i=0;i<heroes.length;i++) {
        var hero = heroes[i];
        var heroId = hero.getAttribute('data-hero-id');
        removedHeroes[heroId] = {
          element: hero,
          rect: hero.getBoundingClientRect()
        };
      }
      if (removeExitingElement) {
        removeExitingElement();
      }
    },
    registerEnteringHeroes: function(enteringElement, animateParent) {
      // the enteringElement is searched for hero elements that are added
      var heroes = enteringElement.querySelectorAll('*[data-hero-id]');
      for (var i=0;i<heroes.length;i++) {
        var hero = heroes[i];
        var heroId = hero.getAttribute('data-hero-id');
        addedHeroes[heroId] = {element: hero, animateParent: animateParent};
      }
    },
    registerEnterPage: function(enteringElement, enterPageAnimation) {
      // enterPageAnimation is applied recursively to all children of enteringElement, except for elements who are a parent of a hero that is doing a hero-transition.
      // the enteringElement is also searched for hero elements that are entering.
      enterPages.push({element: enteringElement, animation: enterPageAnimation});
      heroManager.registerEnteringHeroes(enteringElement, enteringElement);
    },
    execute: function() {
      // Matches removed and added heroes and performs a hero-transition between them. Also executes enter-page animations.
      var matchedAddedHeroes = [];
      Object.keys(addedHeroes).forEach(function(heroId) {
        var exitingHero = removedHeroes[heroId];
        if (exitingHero) {
          matchedAddedHeroes.push(addedHeroes[heroId]);
          var enteringHeroElement = addedHeroes[heroId].element;
          exitingHero.element.style.visibility = 'hidden';
          var newRect = enteringHeroElement.getBoundingClientRect();
          velocity.animate(enteringHeroElement, 'stop');
          enteringHeroElement.style.opacity = '1';
          var dx = newRect.left - exitingHero.rect.left;
          var dy = newRect.top - exitingHero.rect.top;
          enteringHeroElement.style.transform = 'translateX('+(-dx)+'px) translateY('+(-dy)+'px)';
          velocity.animate(enteringHeroElement,{translateX: [0, -dx], translateY: [0, -dy]}, 350, 'ease-in-out', function() {
            enteringHeroElement.style.transition = '';
          });
        }
      });
      enterPages.forEach(function(enterPage) {
        var pageElement = enterPage.element;
        var heroes = [];
        matchedAddedHeroes.forEach(function(addedHero) {
          if (addedHero.animateParent === pageElement) {
            heroes.push(addedHero.element);
          }
        });
        if (heroes.length === 0) {
          enterPage.animation(pageElement);
        } else {
          animateChildrenExceptHeroes(pageElement, pageElement, heroes, enterPage.animation);
        }
      });
      
      enterPages = [];
      addedHeroes = {};
      removedHeroes = {};
    }
  };
  return heroManager;
};

module.exports = createHeroManager;