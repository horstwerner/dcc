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

    const childAspectRatio = this.childAspectRatio || this.childSize.width / this.childSize.height;
    let childCount = elements.length;


    // take into account impact of aspect ratio of contained objects
    const effectiveAR = this.areaw / this.areah / childAspectRatio;

    //calculate number of rows and columns, then distances in Grid
    let rows = Math.min(childCount, Math.max(Math.round(Math.sqrt(childCount / effectiveAR)), 1));
    if (rows < childCount && (childCount - rows) / childCount < 0.2) {
      rows = childCount;
    }
    const cols = Math.ceil(childCount / rows);
    const {width, height} = this.childSize;
    const padding = Math.min(width, height) * this.padding;

    const maxScale = this.maxScale || 1;

    const childScale = Math.min(maxScale, this.areaw / ((cols * width + (cols - 1) * padding) || 1), this.areah / ((rows * height + (rows - 1) * padding) || 1));

    const xStep = (width + padding) * childScale;
    const yStep = (height + padding) * childScale;

    let index = 0;
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const row = Math.floor(index / cols);
      const col = index % cols;

      const rasterpos = {
        x: this.xOffset + col * xStep,
        y: this.yOffset + row * yStep,
        scale: childScale
      };
      callback(element, rasterpos);
      index++;
    }
  };

}