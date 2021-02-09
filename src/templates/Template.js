import P from 'prop-types';
import { mapValues } from 'lodash';
import CheckedObject from "@/CheckedObject";
import ColorCoder from "@symb/ColorCoder";

export const sizeType = {w: P.number, h: P.number};
export const positionType = {...sizeType, x: P.number, y: P.number};

const fillPlaceholders = function fillPlaceholders(element, options, defaultValues) {
  return mapValues(element,(value) => {
    if (typeof value === 'string' && value.charAt(0)==='$') {
      const key = value.substring(1);
      return options[key] != null ? options[key] : defaultValues[key];
    } else return value;
  })
}

export default class Template extends CheckedObject{

  static propertyTypes = {
    id: P.string.isRequired,
    name: P.string,
    aggregate: P.bool,
    background: P.shape({
      type: P.string.isRequired,
      source: P.string,
      color: P.string,
      ...sizeType
    }),
    appliesTo: P.oneOfType([P.string,P.array]),
    clickable: P.bool,
    preprocessing: P.arrayOf(P.shape({method: P.string.isRequired, result: P.string, inputSelector: P.object})),
    colorcoding: P.shape(ColorCoder.propTypes),
    options: P.objectOf(P.shape({options: P.arrayOf(P.shape({label: P.string, value: P.any})), default: P.any})),
    elements: P.arrayOf(P.shape(
        {
          key: P.string.isRequired,
          type: P.oneOf(["caption","textfield","card","cards","chart","trellis","link"]).isRequired,
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

  getDefaultOptions() {
    return this.options ?
        mapValues(this.options, (option) => option.defaultValue) :
        {};
  }

  getElementsForOptions(options) {
    if (this.options) {
      const defaultValues = mapValues(this.options, option => option.defaultValue);
      return this.elements.map(element => fillPlaceholders(element, options || {}, defaultValues));
    }
    return this.elements;
  }

  getType() {
    return this.type;
  }

  getCardColor(node) {
    if (node && this.colorCoder) {
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
