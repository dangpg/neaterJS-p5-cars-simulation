import Car from './car.js';
import Game from './game.js';

var CANVAS = {
  WIDTH: document.getElementById('canvas').clientWidth,
  HEIGHT: document.getElementById('canvas').clientHeight
};
var FRAMERATE = 60;

var POPULATION_SIZE = 100;
var NUM_INPUTS = 8;
var NUM_OUTPUTS = 2;

// neaterJS.CONFIG.ALLOW_LOOPS = true;
var NEAT;

var TRACK_WIDTH = 50;
var TRACK_WIDTH_SLIDER;
var TRACK_WIDTH_TEXT;

var RESET_BUTTON;

var canvas = function(p5) {
  let game;
  let cars = [];

  p5.preload = function() {
    // load sprites if needed
    TRACK_WIDTH_SLIDER = p5.createSlider(15, 100, 50).parent('game-options');
    TRACK_WIDTH_TEXT = p5.createSpan('Track width: ' + TRACK_WIDTH + 'px').parent('game-options');

    RESET_BUTTON = p5.createButton('RESET');
    RESET_BUTTON.mousePressed(p5.setup);
  };

  p5.setup = function() {
    NEAT = neaterJS.init(POPULATION_SIZE, NUM_INPUTS, NUM_OUTPUTS, neaterJS.Activations.sigmoid);

    p5.createCanvas(CANVAS.WIDTH, CANVAS.HEIGHT);
    p5.frameRate(FRAMERATE);

    resetGUI();
    positionGUI();

    // Setup game
    game = new Game(CANVAS.WIDTH, CANVAS.HEIGHT, TRACK_WIDTH);
    game.setup(p5);
  };

  p5.draw = function() {
    // steerCar0();

    // Clear canvas
    p5.clear();

    updateGUI();

    // Update game
    cars = game.update(p5, NEAT, TRACK_WIDTH);
    game.draw(p5);

    // ----------------RUN SIMULATION----------------------
    for (let i = 0; i < cars.length; i++) {
      if (cars[i].isDead) {
        continue;
      }

      if (cars[i].numCompletedLaps > 9) {
        cars[i].isDead = true;
        continue;
      }

      cars[i].act();
      cars[i].update();
      cars[i].draw(p5);

      if (p5.frameCount % 300 === 0) {
        if (cars[i].isStucked()) {
          cars[i].isDead = true;
        }
      }
    }

    // ----------------EVALUATE----------------------
    if (cars.every(p => p.isDead) && cars.length > 0) {
      for (let i = 0; i < cars.length; i++) {
        cars[i].evaluate();
      }

      NEAT.repopulate();
      game.reset();
      // p5.setup();
    }
  };

  p5.mouseClicked = function() {
    if (!clickOnGUI()) {
      game.addVertex(p5);
    }
  };

  p5.mouseWheel = function(event) {
    if (event.delta < 0) {
      TRACK_WIDTH_SLIDER.value(TRACK_WIDTH_SLIDER.value() + 1);
    } else {
      TRACK_WIDTH_SLIDER.value(TRACK_WIDTH_SLIDER.value() - 1);
    }
  };

  p5.windowResized = function() {
    CANVAS = {
      WIDTH: document.getElementById('canvas').clientWidth,
      HEIGHT: document.getElementById('canvas').clientHeight
    };

    p5.resizeCanvas(CANVAS.WIDTH, CANVAS.HEIGHT);
    positionGUI();
  };

  function steerCar0() {
    if (p5.keyIsDown(87)) {
      cars[0].accelerate();
    }

    if (p5.keyIsDown(83)) {
      cars[0].decelerate();
    }

    if (p5.keyIsDown(65)) {
      cars[0].turnLeft();
    }

    if (p5.keyIsDown(68)) {
      cars[0].turnRight();
    }
  }

  function resetGUI() {
    TRACK_WIDTH = 50;
    TRACK_WIDTH_SLIDER.value(TRACK_WIDTH);
    TRACK_WIDTH_TEXT.html('Track width: ' + TRACK_WIDTH + 'px');
  }

  function updateGUI() {
    if (TRACK_WIDTH_SLIDER.value() !== TRACK_WIDTH) {
      TRACK_WIDTH = TRACK_WIDTH_SLIDER.value();
      TRACK_WIDTH_TEXT.html('Track width: ' + TRACK_WIDTH + 'px');
    }
  }

  function clickOnGUI() {
    let hit = false;

    // Reset button
    hit = p5.collidePointRect(
      p5.mouseX,
      p5.mouseY,
      RESET_BUTTON.x,
      RESET_BUTTON.y,
      RESET_BUTTON.width,
      RESET_BUTTON.height
    );

    let gameOptions = p5.select('#game-options');

    // Track width slider
    hit =
      hit ||
      p5.collidePointRect(
        p5.mouseX,
        p5.mouseY,
        gameOptions.elt.offsetTop,
        gameOptions.elt.offsetLeft,
        gameOptions.elt.offsetWidth,
        gameOptions.elt.offsetHeight
      );

    return hit;
  }

  function positionGUI() {
    RESET_BUTTON.position(p5.width - 100, p5.height - 50);
  }
};

new p5(canvas, 'canvas');
