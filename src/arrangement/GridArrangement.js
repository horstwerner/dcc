export default class GridArrangement {

  constructor(padding) {
    this.xOffset = 0;
    this.yOffset = 0;
    this.areaw = 0;
    this.areah = 0;
    this.padding = padding;
    this.outerpadding = 0;
    this.maxChildsize = undefined;
    this.compact = false;
  };

  setOffset(xOffset, yOffset) {
    this.xOffset = xOffset;
    this.yOffset = yOffset;
    return this;
  };

  setArea(areaw, areah) {
    this.areaw = areaw;
    this.areah = areah;
    return this;
  };

  setOuterPadding = function (value) {
    this.outerpadding = value;
    return this;
  };

  setInnerPadding = function (value) {
    this.padding = value;
    return this;
  };

  setMaxChildsize = function (size) {
    this.maxChildsize = size;
    return this;
  };

  setChildAspectRatio = function (ar) {
    this.childAspectRatio = ar;
    return this;
  };

  setCompact = function (value) {
    this.compact = value;
    return this;
  };

  arrange = function (elements, tween, generateUndo) {

    if (!elements || elements.length === 0) return;
    const undoMovements = generateUndo ? [] : null;


    const childaspectratio = this.childAspectRatio || elements[0].getAspectRatio();
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
      const child = elements[i];
      const row = Math.floor(index / cols);
      const col = index % cols;
      const centery = yoffset + row * ystep;
      const centerx = xoffset + col * xstep;

      const {width, height} = child.getSize();

      const childAR = width / height;
      const childscale = childAR >= spacear ?
          maxw / width :
          maxh / height;
      const rasterpos = child.getPos2Center(centerx, centery, childscale);

      if (tween) {
        if (!child.hasPosition) {
          child.setPos(rasterpos.x, rasterpos.y, 0.000001);
        } else {
        }
        tween.addTransform(child, rasterpos.x, rasterpos.y, childscale);
        if (generateUndo) {
          undoMovements.push({
            action: 'move',
            actor: child.getId(),
            x: child.x,
            y: child.y,
            scale: child.scale
          })
        }
      } else {
        child.updateTransform(rasterpos.x, rasterpos.y, childscale);
      }
      index++;
    }

    return undoMovements;
  };
}