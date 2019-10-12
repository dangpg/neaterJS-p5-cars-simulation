import Track from "./track.js";

var CANVAS = {
  WIDTH: document.getElementById("canvas").clientWidth,
  HEIGHT: document.getElementById("canvas").clientHeight
};
var FRAMERATE = 60;

var MODES = {
  SETUP: "setup",
  RACE: "race"
};

var MODE;

var canvas = function(p5) {
  let track;

  p5.setup = function() {
    p5.createCanvas(CANVAS.WIDTH, CANVAS.HEIGHT);
    p5.frameRate(FRAMERATE);

    MODE = MODES.SETUP;

    track = new Track(p5);
  };

  p5.draw = function() {
    p5.background(255);

    if (MODE === MODES.SETUP) {
      track.update();
    } else if (MODE === MODES.RACE) {
    }
  };

  p5.mouseClicked = function() {
    if (MODE === MODES.SETUP) {
      track.mouseClicked();
    }
  };
};

new p5(canvas, "canvas");
