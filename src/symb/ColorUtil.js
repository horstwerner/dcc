
export class Color {
  constructor(r, g, b, a) {
    this.red = r;
    this.green = g;
    this.blue = b;
    this.alpha = a;
  };


  toString() {
    if (this.alpha === 1) {
      return 'rgb(' + this.red + ',' + this.green + ',' + this.blue + ')';
    }
    return 'rgba(' + this.red + ',' + this.green + ',' + this.blue + ',' + this.alpha + ')';
  };
}

  /**
   *
   * @param {String} color
   */
  export const splitColor = function splitColor(color) {

    if (typeof color === 'object' && color.constructor === Color) return color;

    let red, green, blue, alpha;

    if (color.charAt(0) === '#') {
      red = parseInt(color.substr(1,2), 16);
      green = parseInt(color.substr(3,2), 16);
      blue = parseInt(color.substr(5,2), 16);
      alpha = 1;
    } else if (color.startsWith('rgb(')) {
      let components = color.substring(4, color.indexOf(')'))
          .replace(/ /g, '')
          .split(',');
      red = Number(components[0]);
      green = Number(components[1]);
      blue = Number(components[2]);
      alpha = Number(1);
    } else if (color.startsWith('rgba(')) {
      let components = color.substring(5, color.indexOf(')'))
          .replace(/ /g, '')
          .split(',');
      red = Number(components[0]);
      green = Number(components[1]);
      blue = Number(components[2]);
      alpha = Number(components[3]);
    } else {
      throw new Error("don't understand format of color " + color);
    }
    return new Color(red, green, blue, alpha);
  };

  const interp = function (v0, v1, tau) {
    return Math.round(v0 + tau * (v1 - v0));
  };

  /**
   *
   * @param {Color} c1 color object having red, green, blue and alpha attributes
   * @param {Color} c2 color object having red, green, blue and alpha attributes
   * @param tau 0 -> c1, 1 -> c2
   * @return {string} a color string
   */
  export const interpolate = function interpolate(c1, c2, tau) {
    return 'rgba(' + interp(c1.red, c2.red, tau) +
        ',' + interp(c1.green, c2.green, tau) +
        ',' + interp(c1.blue, c2.blue, tau) +
        ',' + interp(c1.alpha, c2.alpha, tau) + ')';
  };

  export const overlay = function overlay(basecolor, topcolor) {
    const c1 = splitColor(basecolor);
    const c2 = splitColor(topcolor);

    const alpha1 = 1 - c2.alpha;

    let newred = Math.round(alpha1 * c1.red + c2.alpha * c2.red);
    let newgreen = Math.round(alpha1 * c1.green + c2.alpha * c2.green);
    let newblue = Math.round(alpha1 * c1.blue + c2.alpha * c2.blue);
    return new Color(newred, newgreen, newblue, c1.alpha);
  };

  export class Gradient {
    constructor() {
      this.points = [];
    }

    /**
     *
     * @param {number} value
     * @param {string} color
     */
    addInterpolationPoint(value, color) {
      this.points.push({'value': value, 'color': splitColor(color)});
    };

    getColorFor(value) {

      if (isNaN(value)) {
        throw new Error("Value is not a number");
      }

      if (this.points[0].value >= value) {
        return this.points[0].color;
      }

      let index = 0;

      while (index < this.points.length && this.points[index].value < value) {
        index++;
      }
      //index now points at first point with value < specified value

      if (index === this.points.length) {
        return this.points[index].color;
      }

      const p0 = this.points[index - 1];
      const p1 = this.points[index];

      return interpolate(p0.color, p1.color, (value - p0.value) / (p1.value - p0.value));
    };

    renderInCanvas(canvas) {
      const highestValue = this.points[this.points.length - 1].value;
      const lowestValue = this.points[0].value;
      const scalex = (highestValue - lowestValue) / canvas.width;
      const ctx = canvas.getContext('2d');
      for (let x = 0; x < canvas.width; x++) {
        ctx.fillStyle = this.getColorFor(x * scalex + lowestValue);
        ctx.fillRect(x, 0, 1, canvas.height);
      }
    };
  }
