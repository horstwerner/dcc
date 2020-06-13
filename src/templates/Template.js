import P from 'prop-types';
import CheckedObject from "@/CheckedObject";
import {ARRANGEMENT_DEFAULT} from "@/templates/TemplateRegistry";
import ColorCoder from "@symb/ColorCoder";

export const sizeType = {w: P.number, h: P.number};
export const positionType = {...sizeType, x: P.number, y: P.number};
export const arrangementType= {type: P.string.isRequired, x: P.number, y: P.number, w: P.number, h: P.number};

const extractDefaultArrangement = function extractDefaultArrangement(descriptor) {

  const { size } = descriptor;
  const layout = {KEY_BACKGROUND: {x: 0, y: 0, w: size.w, h: size.h}};

  descriptor.elements.forEach(element => {
    const { w, h, x, y, alpha, arrangement, onClick } = element;

    layout[element.key] = {
      x: x || 0,
      y: y || 0,
      w,
      h,
      alpha: alpha || 1,
      arrangement,
      onClick
    };
  });
  return {size, layout };
};

export default class Template extends CheckedObject{

  static propertyTypes = {
    type: P.string.isRequired,
    background: P.shape({
      type: P.string.isRequired,
      source: P.string,
      color: P.string,
      ...sizeType
    }),
    colorcoding: P.shape(ColorCoder.propTypes),
    elements: P.arrayOf(P.shape(
        {
          key: P.string.isRequired,
          type: P.oneOf(["caption","textfield","childcards"]).isRequired,
          source: P.string,
          aggregate: P.object,
          template: P.string,
          ...positionType,
          clickAction: P.string
        })),
    arrangements: P.objectOf(P.shape({
      size: P.shape(sizeType),
      layout: P.objectOf(P.shape({
        ...positionType,
        arrangement: P.oneOfType([P.string,P.shape(arrangementType)])
      }))
    }))
  };

  constructor(descriptor) {
    super(descriptor);
    if (!descriptor.arrangements) {
      this.arrangements = {};
    }
    if (!this.arrangements[ARRANGEMENT_DEFAULT]) {
      this.arrangements[ARRANGEMENT_DEFAULT] = extractDefaultArrangement(descriptor);
    }
    if (descriptor.colorcoding) {
      this.colorCoder = new ColorCoder(descriptor.colorcoding);
    }
  }

  getCardColor(node) {
    if (this.colorCoder) {
      return this.colorCoder.getColor(node);
    } else {
      return this.background.color;
    }
  }

  getChildProps(elementName, arrangementName) {
    const arrangementLayout = this.arrangements[arrangementName] && this.arrangements[arrangementName].layout[elementName];
    return {...this.arrangements[ARRANGEMENT_DEFAULT].layout[elementName], ...arrangementLayout};
  }

  getSize(arrangementName) {

    if (arrangementName && this.arrangements[arrangementName].size ) {
      const {w, h} = this.arrangements[arrangementName].size;
      if (isNaN(w)|| isNaN(h)) {
        throw new Error(`No size defined for template ${this.type}`);
      }
      return {width: w, height: h};
    }

    const {w, h} = (this.size || this.arrangements[ARRANGEMENT_DEFAULT].size || this.background);
    if (isNaN(w)|| isNaN(h)) {
      throw new Error(`No size defined for template ${this.type}`);
    }
    return {width: w, height: h};
  }

  getAspectRatio(arrangementName) {
    const {width, height} = this.getSize(arrangementName);
    return width / height;
  }

}