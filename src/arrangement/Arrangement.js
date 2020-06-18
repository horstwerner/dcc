export default class Arrangement {

  constructor(padding, childSize) {
    this.xOffset = 0;
    this.yOffset = 0;
    this.areaw = 0;
    this.areah = 0;
    this.padding = padding;
    this.outerpadding = 0;
    this.maxChildsize = undefined;
    this.childSize = childSize;
    this.compact = false;
  };

  setOffset(xOffset, yOffset) {
    this.xOffset = xOffset || 0;
    this.yOffset = yOffset || 0;
    return this;
  };

  setArea(areaw, areah) {
    this.areaw = areaw;
    this.areah = areah;
    return this;
  };

  getSize() {
    return {width: this.areaw, height: this.areah}
  }

  getOffset() {
    return {x: this.xOffset, y: this.yOffset};
  }

  setChildSize(childSize) {
    this.childSize = childSize;
  }

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

  arrange(elements, tween) {
    this.forEachRasterpos(elements, (element, rasterPos) => {
      if (tween) {
        tween.addTransform(element, rasterPos.x, rasterPos.y, rasterPos.scale);
      } else {
        element.updateSpatial(rasterPos);
      }
    });
  }
}