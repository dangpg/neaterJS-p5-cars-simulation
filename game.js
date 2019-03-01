import Car from './car.js';

var MODES = {
  SETUP: 'setup',
  DRAWTRACK: 'drawtrack',
  RACE: 'race'
};

export default class Game {
  constructor(canvasWidth, canvasHeight, trackWidth, NEAT) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.trackWidth = trackWidth;

    this.vertices = [];
    this.innerVertices = [];
    this.outerVertices = [];
    this.startLine;
    this.goalLines = [];
    this.mode = MODES.SETUP;
    this.startPos;
    this.cars = [];
  }

  setup(p5) {
    // insert code here which gets triggered once in the beginning
  }

  reset() {
    this.mode = MODES.DRAWTRACK;
    this.cars = [];
  }

  update(p5, NEAT) {
    // insert code here which gets triggered every time the canvas gets redrawn
    if (this.mode === MODES.DRAWTRACK) {
      // Setup players
      for (let i = 0; i < NEAT.population.length; i++) {
        let car = new Car(this.startPos.x, this.startPos.y, this.startPos.angle, NEAT.population[i]);
        car.setup();
        this.cars.push(car);
      }

      // console.log((this.startPos.angle * 180) / Math.PI);

      this.mode = MODES.RACE;
      return this.cars;
    } else if (this.mode === MODES.RACE) {
      let aliveCars = this.cars.filter(c => !c.isDead);
      for (let i = 0, len = aliveCars.length; i < len; i++) {
        let aliveCar = aliveCars[i];
        // check for collisions
        if (this.checkCollision(p5, aliveCar, this.innerVertices, this.outerVertices)) {
          aliveCar.isDead = true;
        }

        // set car's scores
        if (this.checkScoreCollision(p5, aliveCar, this.goalLines)) {
          aliveCar.score++;
        }

        // set cars' sensor values
        for (let j = 0, len2 = aliveCar.numSensors; j < len2; j++) {
          let lowestInnerDistance = aliveCar.sensorStrength;
          let lowestOuterDistance = lowestInnerDistance;
          let sensor = aliveCar.sensors[j];

          for (let k = 0, len3 = this.innerVertices.length; k < len3; k++) {
            let nextIndex = k === len3 - 1 ? 0 : k + 1;
            let innerHit = p5.collideLineLine(
              sensor.x1,
              sensor.y1,
              sensor.x2,
              sensor.y2,
              this.innerVertices[k].x,
              this.innerVertices[k].y,
              this.innerVertices[nextIndex].x,
              this.innerVertices[nextIndex].y,
              true
            );

            if (innerHit.x) {
              let sensorValue = Math.sqrt(Math.pow(sensor.x1 - innerHit.x, 2) + Math.pow(sensor.y1 - innerHit.y, 2));
              if (sensorValue < lowestInnerDistance) {
                lowestInnerDistance = sensorValue;
              }
            }
            
            let outerhit = p5.collideLineLine(
              sensor.x1,
              sensor.y1,
              sensor.x2,
              sensor.y2,
              this.outerVertices[k].x,
              this.outerVertices[k].y,
              this.outerVertices[nextIndex].x,
              this.outerVertices[nextIndex].y,
              true
            );

            if (outerhit.x) {
              let sensorValue = Math.sqrt(Math.pow(sensor.x1 - outerhit.x, 2) + Math.pow(sensor.y1 - outerhit.y, 2));
              if (sensorValue < lowestOuterDistance) {
                lowestOuterDistance = sensorValue;
              }
            }

            if (lowestInnerDistance < aliveCar.sensorStrength && lowestInnerDistance < lowestOuterDistance) {
              aliveCar.sensorValues[j] = lowestInnerDistance;
            }
      
            if (lowestOuterDistance < aliveCar.sensorStrength && lowestOuterDistance < lowestInnerDistance) {
              aliveCar.sensorValues[j] = lowestOuterDistance;
            }
          }
        }
      }
    }

    return this.cars;
  }

  draw(p5) {
    switch (this.mode) {
      case MODES.SETUP: {
        for (let i = 0; i < this.vertices.length; i++) {
          if (
            i == 0 &&
            this.vertices.length > 2 &&
            p5.collidePointRect(p5.mouseX, p5.mouseY, this.vertices[0].x, this.vertices[0].y, 10, 10)
          ) {
            p5.fill(255, 0, 0);
          } else {
            p5.fill(255);
          }
          p5.rect(this.vertices[i].x, this.vertices[i].y, 10, 10);
          p5.fill(0);
          p5.text(i, this.vertices[i].x + 20, this.vertices[i].y + 20);
        }
        break;
      }

      case MODES.RACE: {
      }

      case MODES.DRAWTRACK: {
        p5.push();
        p5.stroke(255, 0, 0);
        p5.line(this.startLine.x1, this.startLine.y1, this.startLine.x2, this.startLine.y2);
        p5.pop();

        // Draw track
        for (let i = 0; i < this.outerVertices.length; i++) {
          let nextIndex = i === this.outerVertices.length - 1 ? 0 : i + 1;

          p5.line(
            this.outerVertices[i].x,
            this.outerVertices[i].y,
            this.outerVertices[nextIndex].x,
            this.outerVertices[nextIndex].y
          );

          p5.line(
            this.innerVertices[i].x,
            this.innerVertices[i].y,
            this.innerVertices[nextIndex].x,
            this.innerVertices[nextIndex].y
          );
        }

        // Draw goal lines
        p5.push();
        p5.stroke(255, 204, 0);
        for (let i = 0; i < this.goalLines.length; i++) {
          p5.line(this.goalLines[i].x1, this.goalLines[i].y1, this.goalLines[i].x2, this.goalLines[i].y2);
        }
        p5.pop();

        break;
      }
    }
  }

  checkScoreCollision(p5, car, goalLines) {
    for (let i = 0; i < goalLines.length; i++) {
      let hit = p5.collideLineRect(
        goalLines[i].x1,
        goalLines[i].y1,
        goalLines[i].x2,
        goalLines[i].y2,
        car.x - car.width / 2,
        car.y - car.height / 2,
        car.width,
        car.height
      );

      if (hit) {
        if (car.lasthit == undefined) {
          car.lasthit = i;
        }

        car.nexthit = car.lasthit == goalLines.length - 1 ? 0 : car.lasthit + 1;
        if (i == car.nexthit) {
          car.lasthit = i;
          return true;
        }
      }
    }
    return false;
  }

  checkCollision(p5, car, innerVertices, outerVertices) {
    for (let i = 0; i < innerVertices.length; i++) {
      let nextIndex = i === innerVertices.length - 1 ? 0 : i + 1;

      let hit =
        p5.collideLineRect(
          innerVertices[i].x,
          innerVertices[i].y,
          innerVertices[nextIndex].x,
          innerVertices[nextIndex].y,
          car.x - car.width / 2,
          car.y - car.height / 2,
          car.width,
          car.height
        ) ||
        p5.collideLineRect(
          outerVertices[i].x,
          outerVertices[i].y,
          outerVertices[nextIndex].x,
          outerVertices[nextIndex].y,
          car.x - car.width / 2,
          car.y - car.height / 2,
          car.width,
          car.height
        );

      if (hit) return true;
    }

    return false;
  }

  addVertex(p5) {
    if (
      this.vertices.length > 2 &&
      p5.collidePointRect(p5.mouseX, p5.mouseY, this.vertices[0].x, this.vertices[0].y, 10, 10)
    ) {
      this.calculateTrack(p5);
      this.mode = MODES.DRAWTRACK;
    } else {
      this.vertices.push({ x: p5.mouseX, y: p5.mouseY });
    }
  }

  calculateTrack(p5) {
    let outerLines = [];
    let innerLines = [];
    for (let i = 0; i < this.vertices.length; i++) {
      let nextIndex = i === this.vertices.length - 1 ? 0 : i + 1;

      let dx = this.vertices[nextIndex].x - this.vertices[i].x;
      let dy = this.vertices[nextIndex].y - this.vertices[i].y;
      let len = Math.sqrt(
        Math.pow(this.vertices[nextIndex].x - this.vertices[i].x, 2) +
          Math.pow(this.vertices[nextIndex].y - this.vertices[i].y, 2)
      );
      let udx = dx / len;
      let udy = dy / len;
      let nx = this.vertices[i].x - udy * this.trackWidth;
      let ny = this.vertices[i].y + udx * this.trackWidth;

      let nx2 = this.vertices[i].x + udy * this.trackWidth;
      let ny2 = this.vertices[i].y - udx * this.trackWidth;

      if (i == 0) {
        this.startLine = { x1: nx + dx * 0.5, y1: ny + dy * 0.5, x2: nx2 + dx * 0.5, y2: ny2 + dy * 0.5 };
        this.startPos = { x: this.vertices[0].x + dx * 0.5, y: this.vertices[0].y + dy * 0.5 };

        let xx = this.startLine.x1 - this.startLine.x2;
        let yy = this.startLine.y1 - this.startLine.y2;
        this.startPos.angle = Math.atan(xx / yy);
      }

      let numOfGoalLines = Math.floor(len / 25);

      outerLines.push({ x1: nx - dx, y1: ny - dy, x2: nx + dx * 2, y2: ny + dy * 2 });
      innerLines.push({ x1: nx2 - dx, y1: ny2 - dy, x2: nx2 + dx * 2, y2: ny2 + dy * 2 });

      for (let j = 0; j < numOfGoalLines; j++) {
        let goalline = {
          x1: nx + (j / numOfGoalLines) * dx - udy * this.trackWidth,
          y1: ny + (j / numOfGoalLines) * dy + udx * this.trackWidth,
          x2: nx2 + (j / numOfGoalLines) * dx + udy * this.trackWidth,
          y2: ny2 + (j / numOfGoalLines) * dy - udx * this.trackWidth,
          section: i
        };

        this.goalLines.push(goalline);
      }
    }

    for (let i = 0; i < outerLines.length; i++) {
      let prevIndex = i === 0 ? outerLines.length - 1 : i - 1;

      let hit = p5.collideLineLine(
        outerLines[i].x1,
        outerLines[i].y1,
        outerLines[i].x2,
        outerLines[i].y2,
        outerLines[prevIndex].x1,
        outerLines[prevIndex].y1,
        outerLines[prevIndex].x2,
        outerLines[prevIndex].y2,
        true
      );

      let hit2 = p5.collideLineLine(
        innerLines[i].x1,
        innerLines[i].y1,
        innerLines[i].x2,
        innerLines[i].y2,
        innerLines[prevIndex].x1,
        innerLines[prevIndex].y1,
        innerLines[prevIndex].x2,
        innerLines[prevIndex].y2,
        true
      );

      if (hit.x) {
        this.outerVertices.push({ x: hit.x, y: hit.y });
      }

      if (hit2.x) {
        this.innerVertices.push({ x: hit2.x, y: hit2.y });
      }
    }

    let filteredGoalLines = [];
    for (let i = 0; i < this.goalLines.length; i++) {
      let nextIndex =
        this.goalLines[i].section === this.goalLines[this.goalLines.length - 1].section
          ? 0
          : this.goalLines[i].section + 1;
      let hit =
        p5.collideLineLine(
          this.goalLines[i].x1,
          this.goalLines[i].y1,
          this.goalLines[i].x2,
          this.goalLines[i].y2,
          this.innerVertices[this.goalLines[i].section].x,
          this.innerVertices[this.goalLines[i].section].y,
          this.innerVertices[nextIndex].x,
          this.innerVertices[nextIndex].y
        ) &&
        p5.collideLineLine(
          this.goalLines[i].x1,
          this.goalLines[i].y1,
          this.goalLines[i].x2,
          this.goalLines[i].y2,
          this.outerVertices[this.goalLines[i].section].x,
          this.outerVertices[this.goalLines[i].section].y,
          this.outerVertices[nextIndex].x,
          this.outerVertices[nextIndex].y
        );

      if (hit) {
        filteredGoalLines.push(this.goalLines[i]);
      }
    }

    this.goalLines = filteredGoalLines;
  }
}
