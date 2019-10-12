export default class Car {
  constructor(x, y, angle, brain) {
    this.x = x;
    this.y = y;
    this.angle = Math.PI / 2 - angle;
    this.brain = brain;
    this.width = 10;
    this.height = 20;
    this.speed = 0;
    this.isDead = false;
    this.score = 0;

    this.numSensors = 8;
    this.sensorValues = [];
    this.sensors = [];
    this.sensorStrength = 1000;

    this.lastScore = 0;
    this.lastHit = 0;
    this.nextHit = 1;
    this.numCompletedLaps = 0;
  }

  getCarVertices(p5) {
    let cornerVertices = [];
    cornerVertices.push(this.getPointRotated(p5, -this.width / 2, -this.height / 2));
    cornerVertices.push(this.getPointRotated(p5, this.width / 2, -this.height / 2));
    cornerVertices.push(this.getPointRotated(p5, this.width / 2, this.height / 2));
    cornerVertices.push(this.getPointRotated(p5, -this.width / 2, this.height / 2));

    return cornerVertices;
  }

  getPointRotated(p5, xOffset, yOffset) {
    let rotatedX = this.x + xOffset * Math.cos(this.angle) - yOffset * Math.sin(this.angle);
    let rotatedY = this.y + xOffset * Math.sin(this.angle) + yOffset * Math.cos(this.angle);

    return p5.createVector(rotatedX, rotatedY);
  }

  setup() {
    for (let i = 0; i < this.numSensors; i++) {
      this.sensorValues.push(this.sensorStrength);
    }
  }

  isStucked() {
    if (this.score > this.lastScore) {
      this.lastScore = this.score;
      return false;
    }

    return true;
  }

  drawSensors(p5) {
    p5.push();
    p5.stroke(0, 255, 0);
    for (let i = 0; i < this.numSensors; i++) {
      let dy = Math.sin(this.angle + (Math.PI / 4) * i) * this.sensorValues[i];
      let dx = Math.cos(this.angle + (Math.PI / 4) * i) * this.sensorValues[i];
      p5.line(this.x, this.y, this.x + dx, this.y + dy);
    }
    p5.pop();
  }

  drawScores(p5) {
    p5.text(this.score, 15, 15);
  }

  draw(p5) {
    p5.push();
    p5.rectMode(p5.CENTER);
    p5.translate(this.x, this.y);
    // this.drawScores(p5);
    p5.rotate(this.angle);
    p5.fill(255);
    p5.rect(0, 0, this.width, this.height);
    p5.fill(0, 0, 255);
    p5.rect(0, 0 - this.height / 4, this.width, this.height / 2);
    p5.pop();
  }

  updateSensors() {
    for (let i = 0; i < this.numSensors; i++) {
      let dy = Math.sin(this.angle + (Math.PI / 4) * i) * this.sensorStrength;
      let dx = Math.cos(this.angle + (Math.PI / 4) * i) * this.sensorStrength;
      this.sensors[i] = { x1: this.x, y1: this.y, x2: this.x + dx, y2: this.y + dy };
    }
  }

  update() {
    this.x -= this.speed * Math.cos(Math.PI / 2 + this.angle);
    this.y -= this.speed * Math.sin(Math.PI / 2 + this.angle);
    this.updateSensors();

    if (Math.abs(this.speed) < 0.1) {
      this.speed = 0;
    }

    if (this.speed > 0) {
      this.speed -= 0.1;
    } else if (this.speed < 0) {
      this.speed += 0.1;
    }
  }

  act() {
    // give player some information
    this.brain.see(this.sensorValues);

    // perform player's action depending on inputs
    let outputs = this.brain.think();

    if (outputs[0] < 0.5) {
      this.accelerate();
    } else {
      this.decelerate();
    }

    if (outputs[1] < 0.5) {
      this.turnLeft();
    } else {
      this.turnRight();
    }
  }

  evaluate() {
    this.brain.setFitness(Math.pow(Math.E, this.score));
  }

  accelerate() {
    if (this.speed < 5) {
      this.speed += 0.5;
    }
  }

  decelerate() {
    if (this.speed > -5) {
      this.speed -= 0.5;
    }
  }

  turnLeft() {
    this.angle -= Math.PI / 90;
  }

  turnRight() {
    this.angle += Math.PI / 90;
  }
}
