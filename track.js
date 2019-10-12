export default class Track {
  constructor(p5) {
    this.p5 = p5;
    this.vertices = [];

    this.p5.rectMode(this.p5.CENTER);
  }

  update() {
    this.drawPreview();

    // Draw all vertices
    for (let i = 0; i < this.vertices.length; i++) {
      this.p5.rect(this.vertices[i].x, this.vertices[i].y, 10, 10);
    }
  }

  drawPreview() {
    let currMouseVector = this.p5.createVector(this.p5.mouseX, this.p5.mouseY);
    
    this.p5.rect(currMouseVector.x, currMouseVector.y, 10, 10);

    if (this.vertices.length > 0) {
      let outputVertices = this.calculateSection(this.vertices[this.vertices.length - 1], currMouseVector);
      this.p5.fill('red');
      this.p5.rect(outputVertices[0].x, outputVertices[0].y, 10, 10);
      this.p5.rect(outputVertices[1].x, outputVertices[1].y, 10, 10);
      this.p5.fill('blue');
      this.p5.rect(outputVertices[2].x, outputVertices[2].y, 10, 10);
      this.p5.rect(outputVertices[3].x, outputVertices[3].y, 10, 10);
      this.p5.fill(255);
    }
  }

  mouseClicked() {
    this.vertices.push(this.p5.createVector(this.p5.mouseX, this.p5.mouseY));
  }

  calculateSection(vertex1, vertex2) {
    let dx = vertex2.x - vertex1.x;
    let dy = vertex2.y - vertex1.y;
    let len = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

    let udx = len === 0 ? 1 : dx / len;
    let udy = len === 0 ? 1 : dy / len;

    let trackWidth1 = 50;
    let trackWidth2 = 50;

    let nx = vertex1.x - udy * trackWidth1;
    let ny = vertex1.y + udx * trackWidth1;
    let nx2 = vertex1.x + udy * trackWidth1;
    let ny2 = vertex1.y - udx * trackWidth1;

    let nx3 = vertex2.x - udy * trackWidth2;
    let ny3 = vertex2.y + udx * trackWidth2;
    let nx4 = vertex2.x + udy * trackWidth2;
    let ny4 = vertex2.y - udx * trackWidth2;

    let outputVertices = [];
    outputVertices.push(this.p5.createVector(nx, ny));
    outputVertices.push(this.p5.createVector(nx3, ny3));
    outputVertices.push(this.p5.createVector(nx2, ny2));
    outputVertices.push(this.p5.createVector(nx4, ny4));

    return outputVertices;
  }
}
