import Car from "./car.js";

var MODES = {
  SETUP: "setup",
  DRAWTRACK: "drawtrack",
  RACE: "race"
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
    this.isInvalidTrack;
  }

  setup(p5) {
    // insert code here which gets triggered once in the beginning
  }

  reset() {
    this.mode = MODES.DRAWTRACK;
    this.cars = [];
  }

  update(p5, NEAT, trackWidth) {
    this.trackWidth = trackWidth;

    if (this.mode === MODES.SETUP) {
      this.previewTrack(p5, trackWidth);
    } else if (this.mode === MODES.DRAWTRACK) {
      // Setup players
      for (let i = 0; i < NEAT.population.length; i++) {
        let car = new Car(
          this.startPos.x,
          this.startPos.y,
          this.startPos.angle,
          NEAT.population[i]
        );
        car.setup();
        this.cars.push(car);
      }

      this.mode = MODES.RACE;
      return this.cars;
    } else if (this.mode === MODES.RACE) {
      let aliveCars = this.cars.filter(c => !c.isDead);
      for (let i = 0, len = aliveCars.length; i < len; i++) {
        let aliveCar = aliveCars[i];
        // check for collisions
        if (
          this.checkCollision(
            p5,
            aliveCar,
            this.innerVertices,
            this.outerVertices
          )
        ) {
          aliveCar.isDead = true;
        }

        // set car's scores
        this.checkScoreCollision(p5, aliveCar, this.goalLines);

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
              let sensorValue = Math.sqrt(
                Math.pow(sensor.x1 - innerHit.x, 2) +
                  Math.pow(sensor.y1 - innerHit.y, 2)
              );
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
              let sensorValue = Math.sqrt(
                Math.pow(sensor.x1 - outerhit.x, 2) +
                  Math.pow(sensor.y1 - outerhit.y, 2)
              );
              if (sensorValue < lowestOuterDistance) {
                lowestOuterDistance = sensorValue;
              }
            }

            if (
              lowestInnerDistance < aliveCar.sensorStrength &&
              lowestInnerDistance < lowestOuterDistance
            ) {
              aliveCar.sensorValues[j] = lowestInnerDistance;
            }

            if (
              lowestOuterDistance < aliveCar.sensorStrength &&
              lowestOuterDistance < lowestInnerDistance
            ) {
              aliveCar.sensorValues[j] = lowestOuterDistance;
            }
          }
        }
      }
    }

    return this.cars;
  }

  previewTrack(p5, trackWidth) {
    p5.text(
      "Mouse Coordinates: " + p5.mouseX + ", " + p5.mouseY,
      p5.width / 2,
      p5.height - 100
    );

    p5.push();
    p5.textSize(20);
    p5.fill(0, 0, 0, 150);
    p5.stroke(0, 0, 0, 50);
    p5.textAlign(p5.CENTER, p5.CENTER);
    if (this.vertices.length === 0) {
      p5.push();
      p5.fill(0, 0, 0, 0);
      p5.circle(p5.mouseX, p5.mouseY, trackWidth);
      p5.pop();
      p5.text(
        "Use the mouse to draw the race track! :)",
        p5.width / 2,
        p5.height / 2
      );
    } else if (
      this.vertices.length > 2 &&
      p5.collidePointRect(
        p5.mouseX,
        p5.mouseY,
        this.vertices[0].x - 5,
        this.vertices[0].y - 5,
        10,
        10
      )
    ) {

      this.checkValidityOfTrack(
        p5,
        {
          x1: this.innerVertices[this.innerVertices.length - 1].x,
          y1: this.innerVertices[this.innerVertices.length - 1].y,
          x2: this.innerVertices[0].x,
          y2: this.innerVertices[0].y
        },
        {
          x1: this.outerVertices[this.outerVertices.length - 1].x,
          y1: this.outerVertices[this.outerVertices.length - 1].y,
          x2: this.outerVertices[0].x,
          y2: this.outerVertices[0].y
        }
      );

      
      if (this.isInvalidTrack) {
        p5.stroke(255, 0, 0);
      } else {
        p5.stroke(0, 0, 0, 50);
      }

      
      p5.line(
        this.innerVertices[this.innerVertices.length - 1].x,
        this.innerVertices[this.innerVertices.length - 1].y,
        this.innerVertices[0].x,
        this.innerVertices[0].y
      );

      p5.line(
        this.outerVertices[this.outerVertices.length - 1].x,
        this.outerVertices[this.outerVertices.length - 1].y,
        this.outerVertices[0].x,
        this.outerVertices[0].y
      );

    } else {
      let vertex1 = p5.createVector(
        this.vertices[this.vertices.length - 1].x,
        this.vertices[this.vertices.length - 1].y
      );
      let vertex2 = p5.createVector(p5.mouseX, p5.mouseY);
      let vertices = this.calculateVertices(
        p5,
        vertex1,
        vertex2,
        this.vertices[this.vertices.length - 1].trackWidth,
        this.trackWidth
      );

      if (this.outerVertices.length > 1) {
        this.checkValidityOfTrack(
          p5,
          {
            x1: this.innerVertices[this.innerVertices.length - 1].x,
            y1: this.innerVertices[this.innerVertices.length - 1].y,
            x2: vertices[1].x,
            y2: vertices[1].y
          },
          {
            x1: this.outerVertices[this.outerVertices.length - 1].x,
            y1: this.outerVertices[this.outerVertices.length - 1].y,
            x2: vertices[3].x,
            y2: vertices[3].y
          }
        );

        if (this.isInvalidTrack) {
          p5.stroke(255, 0, 0);
        } else {
          p5.stroke(0, 0, 0, 50);
        }

        p5.line(
          this.innerVertices[this.innerVertices.length - 1].x,
          this.innerVertices[this.innerVertices.length - 1].y,
          vertices[1].x,
          vertices[1].y
        );
        p5.line(
          this.outerVertices[this.outerVertices.length - 1].x,
          this.outerVertices[this.outerVertices.length - 1].y,
          vertices[3].x,
          vertices[3].y
        );
      } else {
        p5.line(vertices[0].x, vertices[0].y, vertices[1].x, vertices[1].y);
        p5.line(vertices[2].x, vertices[2].y, vertices[3].x, vertices[3].y);
      }
    }
    p5.pop();
  }

  draw(p5) {
    switch (this.mode) {
      case MODES.SETUP: {
        p5.push();
        p5.rectMode(p5.CENTER);
        for (let i = 0; i < this.vertices.length; i++) {
          if (
            i == 0 &&
            this.vertices.length > 2 &&
            p5.collidePointRect(
              p5.mouseX,
              p5.mouseY,
              this.vertices[0].x - 5,
              this.vertices[0].y - 5,
              10,
              10
            )
          ) {
            p5.fill(255, 0, 0);
          } else {
            p5.fill(255);
          }
          p5.rect(this.vertices[i].x, this.vertices[i].y, 10, 10);
          p5.fill(0);
          p5.text(i, this.vertices[i].x + 20, this.vertices[i].y + 20);
        }
        p5.pop();

        // Draw track
        for (let i = 0; i < this.outerVertices.length - 1; i++) {
          let nextIndex = i + 1;

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
        break;
      }

      case MODES.RACE: {
      }

      case MODES.DRAWTRACK: {
        p5.push();
        p5.stroke(255, 0, 0);
        p5.line(
          this.startLine.x1,
          this.startLine.y1,
          this.startLine.x2,
          this.startLine.y2
        );
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
          p5.line(
            this.goalLines[i].x1,
            this.goalLines[i].y1,
            this.goalLines[i].x2,
            this.goalLines[i].y2
          );
        }
        p5.pop();

        break;
      }
    }
  }

  checkScoreCollision(p5, car, goalLines) {
    for (let i = 0; i < goalLines.length; i++) {
      let hit = p5.collideLinePoly(
        goalLines[i].x1,
        goalLines[i].y1,
        goalLines[i].x2,
        goalLines[i].y2,
        car.getCarVertices(p5)
      );

      if (hit && i === car.nextHit) {
        car.lastHit = i;
        car.nextHit =
          car.lastHit === goalLines.length - 1 ? 0 : car.lastHit + 1;
        car.score += goalLines[i].score;

        if (car.lastHit === 0) {
          car.numCompletedLaps++;
        }
      }
    }
  }

  checkCollision(p5, car, innerVertices, outerVertices) {
    for (let i = 0; i < innerVertices.length; i++) {
      let nextIndex = i === innerVertices.length - 1 ? 0 : i + 1;

      let hit =
        p5.collideLinePoly(
          innerVertices[i].x,
          innerVertices[i].y,
          innerVertices[nextIndex].x,
          innerVertices[nextIndex].y,
          car.getCarVertices(p5)
        ) ||
        p5.collideLinePoly(
          outerVertices[i].x,
          outerVertices[i].y,
          outerVertices[nextIndex].x,
          outerVertices[nextIndex].y,
          car.getCarVertices(p5)
        );

      if (hit) return true;
    }

    return false;
  }

  addVertex(p5) {
    if (this.isInvalidTrack) {
      return;
    }

    if (
      this.vertices.length > 2 &&
      p5.collidePointRect(
        p5.mouseX,
        p5.mouseY,
        this.vertices[0].x - 5,
        this.vertices[0].y - 5,
        10,
        10
      )
    ) {
      // this.calculateTrack(p5);
      this.calculateSection(
        p5,
        this.vertices[0],
        this.vertices[this.vertices.length - 1]
      );
      this.mode = MODES.DRAWTRACK;
    } else {
      this.vertices.push({
        x: p5.mouseX,
        y: p5.mouseY,
        trackWidth: this.trackWidth
      });

      if (this.vertices.length > 1) {
        let v1 = p5.createVector(
          this.vertices[this.vertices.length - 2].x,
          this.vertices[this.vertices.length - 2].y
        );
        let v2 = p5.createVector(
          this.vertices[this.vertices.length - 1].x,
          this.vertices[this.vertices.length - 1].y
        );
        let newVertices = this.calculateVertices(
          p5,
          v1,
          v2,
          this.vertices[this.vertices.length - 2].trackWidth,
          this.vertices[this.vertices.length - 1].trackWidth
        );

        if (this.vertices.length == 2) {
          this.innerVertices.push(newVertices[0]);
          this.outerVertices.push(newVertices[2]);
        }

        this.innerVertices.push(newVertices[1]);
        this.outerVertices.push(newVertices[3]);
      }
    }
  }

  calculateVertices(p5, vertex1, vertex2, trackWidth1, trackWidth2) {
    let dx = vertex2.x - vertex1.x;
    let dy = vertex2.y - vertex1.y;
    let len = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

    let udx = len === 0 ? 1 : dx / len;
    let udy = len === 0 ? 1 : dy / len;

    /*
    n1            n3

    n2            n4
    */

    let nx = vertex1.x - udy * trackWidth1;
    let ny = vertex1.y + udx * trackWidth1;
    let nx2 = vertex1.x + udy * trackWidth1;
    let ny2 = vertex1.y - udx * trackWidth1;

    let nx3 = vertex2.x - udy * trackWidth2;
    let ny3 = vertex2.y + udx * trackWidth2;
    let nx4 = vertex2.x + udy * trackWidth2;
    let ny4 = vertex2.y - udx * trackWidth2;

    let outputVertices = [];
    outputVertices.push(p5.createVector(nx, ny));
    outputVertices.push(p5.createVector(nx3, ny3));
    outputVertices.push(p5.createVector(nx2, ny2));
    outputVertices.push(p5.createVector(nx4, ny4));

    // outputVertices.push(p5.createVector(nx + dx, ny + dy));
    // outputVertices.push(p5.createVector(nx2 + dx, ny2 + dy));

    return outputVertices;
  }

  checkValidityOfTrack(p5, line1, line2) {
    let poly = this.innerVertices.concat(this.outerVertices.slice().reverse());
    let ignorePoints = [this.innerVertices[0], this.innerVertices[this.innerVertices.length - 1], this.outerVertices[0], this.outerVertices[this.outerVertices.length - 1]];
    this.isInvalidTrack =
      // p5.collidePointPoly(line1.x2, line1.y2, poly) ||
      // p5.collidePointPoly(line2.x2, line2.y2, poly) ||
      this.collideLinePoly(p5, line1.x1, line1.y1, line1.x2, line1.y2, poly, ignorePoints) ||
      this.collideLinePoly(p5, line2.x1, line2.y1, line2.x2, line2.y2, poly, ignorePoints) ||
      p5.collideLineLine(
        line1.x1,
        line1.y1,
        line1.x2,
        line1.y2,
        line2.x1,
        line2.y1,
        line2.x2,
        line2.y2
      );
  }

  collideLinePoly(p5, x1, y1, x2, y2, vertices, points) {
    // go through each of the vertices, plus the next vertex in the list
    var next = 0;
    for (var current=0; current<vertices.length; current++) {
  
      // get next vertex in list if we've hit the end, wrap around to 0
      next = current+1;
      if (next == vertices.length) next = 0;
  
      // get the PVectors at our current position extract X/Y coordinates from each
      var x3 = vertices[current].x;
      var y3 = vertices[current].y;
      var x4 = vertices[next].x;
      var y4 = vertices[next].y;
  
      // do a Line/Line comparison if true, return 'true' immediately and stop testing (faster)
      var hit = p5.collideLineLine(x1, y1, x2, y2, x3, y3, x4, y4, true);
      if (hit.x) {
        let realhit = true;
        for (var i = 0; i < points.length; i++) {
          if (hit.x === points[i].x && hit.y === points[i].y) {
            realhit = false;
          }
        }
        if(realhit) {
          return true;
        }
      }
    }
    // never got a hit
    return false;
  }

  calculateSection(p5, vertex1, vertex2) {
    let v1 = p5.createVector(vertex1.x, vertex1.y);
    let v2 = p5.createVector(vertex2.x, vertex2.y);
    let vertices = this.calculateVertices(
      p5,
      v1,
      v2,
      vertex1.trackWidth,
      vertex2.trackWidth
    );

    this.innerVertices.push(vertices[0]);
    this.innerVertices.push(vertices[1]);
    this.outerVertices.push(vertices[2]);
    this.outerVertices.push(vertices[3]);
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

      let numOfGoalLines = Math.floor(len / 25);

      outerLines.push({
        x1: nx - dx,
        y1: ny - dy,
        x2: nx + dx * 2,
        y2: ny + dy * 2
      });
      innerLines.push({
        x1: nx2 - dx,
        y1: ny2 - dy,
        x2: nx2 + dx * 2,
        y2: ny2 + dy * 2
      });

      for (let j = 0; j < numOfGoalLines; j++) {
        let goalline = {
          x1: nx + (j / numOfGoalLines) * dx - udy * this.trackWidth,
          y1: ny + (j / numOfGoalLines) * dy + udx * this.trackWidth,
          x2: nx2 + (j / numOfGoalLines) * dx + udy * this.trackWidth,
          y2: ny2 + (j / numOfGoalLines) * dy - udx * this.trackWidth,
          section: i,
          x1Orig: nx + (j / numOfGoalLines) * dx,
          y1Orig: ny + (j / numOfGoalLines) * dy,
          x2Orig: nx2 + (j / numOfGoalLines) * dx,
          y2Orig: ny2 + (j / numOfGoalLines) * dy
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
        this.goalLines[i].section ===
        this.goalLines[this.goalLines.length - 1].section
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
        filteredGoalLines.push({
          x1: this.goalLines[i].x1Orig,
          y1: this.goalLines[i].y1Orig,
          x2: this.goalLines[i].x2Orig,
          y2: this.goalLines[i].y2Orig,
          section: this.goalLines[i].section
        });
      }
    }

    this.goalLines = filteredGoalLines;

    // first goalLine == startLine
    let xx = this.goalLines[0].x1 - this.goalLines[0].x2;
    let yy = this.goalLines[0].y1 - this.goalLines[0].y2;
    this.startLine = {
      x1: this.goalLines[0].x1,
      y1: this.goalLines[0].y1,
      x2: this.goalLines[0].x2,
      y2: this.goalLines[0].y2
    };
    this.startPos = {
      x: (this.goalLines[0].x1 + this.goalLines[0].x2) / 2,
      y: (this.goalLines[0].y1 + this.goalLines[0].y2) / 2,
      angle: Math.atan(xx / yy)
    };

    for (let i = 0; i < this.goalLines.length; i++) {
      if (i == 0) {
        this.goalLines[i].score = 10;
        continue;
      }

      let numLinesInSection = this.goalLines.filter(
        g => g.section === this.goalLines[i].section
      ).length;
      this.goalLines[i].score = 1 / numLinesInSection;
    }
  }
}
