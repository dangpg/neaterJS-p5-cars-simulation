import Car from './car.js';
import Game from './game.js';

var CANVAS = {
  WIDTH: document.getElementById('canvas').offsetWidth,
  HEIGHT: document.getElementById('canvas').offsetHeight
};
var FRAMERATE = 60;

var POPULATION_SIZE = 100;
var NUM_INPUTS = 8;
var NUM_OUTPUTS = 2;

neaterJS.CONFIG.ALLOW_LOOPS = true;
var NEAT = neaterJS.init(POPULATION_SIZE, NUM_INPUTS, NUM_OUTPUTS, neaterJS.Activations.sigmoid);

console.log("LOOP");

var canvas = function(p5) {
  let game = new Game(CANVAS.WIDTH, CANVAS.HEIGHT, 50);
  let cars = [];

  p5.preload = function() {
    // load sprites if needed
  };

  p5.setup = function() {
    p5.createCanvas(CANVAS.WIDTH, CANVAS.HEIGHT);
    p5.frameRate(FRAMERATE);

    // Setup game
    game.setup(p5);
  };

  p5.draw = function() {

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

    // Clear canvas
    p5.clear();

    // Update game
    cars = game.update(p5, NEAT);
    game.draw(p5);

    // ----------------RUN SIMULATION----------------------
    for (let i = 0; i < cars.length; i++) {
      if (cars[i].isDead) {
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
    game.addVertex(p5);
  };
};

new p5(canvas, 'canvas');
