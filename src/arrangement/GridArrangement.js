import Arrangement from "@/arrangement/Arrangement";

export const GRID = 'grid';

export default class GridArrangement extends Arrangement{

  static type = GRID;

  /**
   *
   * @param {Array} elements
   * @param {function} callback
   */
  forEachRasterpos = function (elements, callback) {

    if (!elements || elements.length === 0) return;

    const childaspectratio = this.childAspectRatio || this.childSize.width / this.childSize.height;
    let childcount = elements.length;


    // take into account impact of aspect ratio of contained objects
    const effectivear = this.areaw / this.areah / childaspectratio;

    //calculate number of rows and columns, then distances in Grid
    let rows = Math.min(childcount, Math.max(Math.round(Math.sqrt(childcount / effectivear)), 1));
    if (rows < childcount && (childcount - rows) / childcount < 0.2) {
      rows = childcount;
    }
    const cols = Math.ceil(childcount / rows);

    const xstep = (this.areaw - 2 * this.outerpadding) / cols;
    let ystep = (this.areah - 2 * this.outerpadding) / rows;
    let maxh = ystep * (childcount === 1 ? 1 : (1 - this.padding));
    if (this.maxChildsize) {
      maxh = Math.min(maxh, this.maxChildsize);
    }
    let maxw = xstep * (childcount === 1 ? 1 : (1 - this.padding));
    if (this.maxChildsize) {
      maxw = Math.min(maxw, this.maxChildsize);
    }
    const spacear = maxw / maxh;
    if (this.compact && childaspectratio >= spacear) {
      debugger
      ystep *= spacear / childaspectratio;
      maxh = ystep * (childcount === 1 ? 1 : (1 - this.padding));
      if (this.maxChildsize) {
        maxh = Math.min(maxh, this.maxChildsize);
      }
    }

    const xoffset = xstep / 2 + this.xOffset + this.outerpadding;
    const yoffset = ystep / 2 + this.yOffset + this.outerpadding;

    let index = 0;
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const row = Math.floor(index / cols);
      const col = index % cols;
      const centery = yoffset + row * ystep;
      const centerx = xoffset + col * xstep;

      const {width, height} = this.childSize;

      const childAR = width / height;
      const childscale = childAR >= spacear ?
          maxw / width :
          maxh / height;
      // const rasterpos = child.getPos2Center(centerx, centery, childscale);
      const rasterpos = {
        x: centerx - 0.5 * childscale * width,
        y: centery - 0.5 * childscale * height,
        scale: childscale
      };
      callback(element, rasterpos);
      index++;
    }
  };

}