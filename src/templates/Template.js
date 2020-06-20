import P from 'prop-types';
import CheckedObject from "@/CheckedObject";
import ColorCoder from "@symb/ColorCoder";

export const sizeType = {w: P.number, h: P.number};
export const positionType = {...sizeType, x: P.number, y: P.number};

export default class Template extends CheckedObject{

  static propertyTypes = {
    type: P.string.isRequired,
    background: P.shape({
      type: P.string.isRequired,
      source: P.string,
      color: P.string,
      ...sizeType
    }),
    preprocessing: P.shape({algorithm: P.string.isRequired, result: P.string.isRequired, inputSelector: P.object}),
    colorcoding: P.shape(ColorCoder.propTypes),
    elements: P.arrayOf(P.shape(
        {
          key: P.string.isRequired,
          type: P.oneOf(["caption","textfield","childcards","chart","trellis"]).isRequired,
          source: P.string,
          aggregate: P.object,
          template: P.string,
          ...positionType,
          clickAction: P.string
        }))
  };

  constructor(descriptor) {
    super(descriptor);
    if (descriptor.colorcoding) {
      this.colorCoder = new ColorCoder(descriptor.colorcoding);
    }
  }

  getType() {
    return this.type;
  }

  getCardColor(node) {
    if (this.colorCoder) {
      return this.colorCoder.getColor(node);
    } else {
      return this.background.color;
    }
  }

  getSize() {

    const {w, h} = (this.size || this.background);
    if (isNaN(w)|| isNaN(h)) {
      throw new Error(`No size defined for template ${this.type}`);
    }
    return {width: w, height: h};
  }

  getAspectRatio() {
    const {width, height} = this.getSize();
    return width / height;
  }

}