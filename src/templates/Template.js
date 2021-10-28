import P from 'prop-types';
import {mapValues} from 'lodash';
import ColorCoder from "@symb/ColorCoder";
import CaptionElement from "@/templates/elements/CaptionElement";
import TextFieldElement from "@/templates/elements/TextFieldElement";
import {sizeType} from "@/templates/elements/TemplateElement";
import BoxElement from "@/templates/elements/BoxElement";
import ImageElement from "@/templates/elements/ImageElement";
import LinkElement from "@/templates/elements/LinkElement";
import CardElement from "@/templates/elements/CardElement";
import CardsElement from "@/templates/elements/CardsElement";
import TrellisElement from "@/templates/elements/TrellisElement";
import ChartElement from "@/templates/elements/ChartElement";
import Filter from "@/graph/Filter";
import {
  AGGREGATE,
  DERIVE_ASSOCIATIONS,
  INTERSECT,
  PATH_ANALYSIS,
  SET_CONTEXT,
  SUBTRACT,
  UNIFY,
  FIRST_FOUND, CREATE_NODE
} from "@/graph/Preprocessors";
import {LOG_LEVEL_PATHS, LOG_LEVEL_RESULTS, OPTION_HIGHLIGHT} from "@/components/Constants";
import {DEFAULT_VIEW_NAME} from "@/templates/TemplateRegistry";

export const SYNTH_NODE_MAP = 'map';
export const SYNTH_NODE_RETRIEVE = 'retrieve';

const fillPlaceholders = function fillPlaceholders(element, options, defaultValues) {
  const result = mapValues(element,(value) => {
    if (typeof value === 'string' && value.charAt(0)==='$') {
      const key = value.substring(1);
      return options[key] != null ? options[key] : (defaultValues[key] || value);
    } else return value;
  });

  if (result.options) {
    result.options = fillPlaceholders(result.options, options, defaultValues);
  }
  return result;
};

const elementClassByType = {};
const elementTypes = [];
//["caption", "box", "image", "textfield", "card", "cards", "chart", "trellis", "link"]
[CaptionElement, TextFieldElement, BoxElement, ImageElement, LinkElement, CardElement, CardsElement, TrellisElement, ChartElement].forEach(elClass => {
  // noinspection JSUnresolvedVariable
  elementClassByType[elClass.key] = elClass;
  // noinspection JSUnresolvedVariable
  elementTypes.push(elClass.key)});

export default class Template {

  static propertyTypes = {
    id: P.string.isRequired,
    name: P.string,
    aggregate: P.bool,
    size: P.shape(sizeType),
    background: P.shape({
      type: P.string.isRequired,
      source: P.string,
      color: P.string,
      cornerRadius: P.number,
      ...sizeType
    }),
    appliesTo: P.oneOfType([P.string,P.array]),
    clickable: P.bool,
    isDefault: P.bool,
    detailTemplate: P.string,
    detailNode: P.shape({
      type: P.string.isRequired,
      uri: P.string.isRequired,
      method: P.oneOf([SYNTH_NODE_MAP,SYNTH_NODE_RETRIEVE]).isRequired,
      mapping: P.object,
      request: P.string
      }),
    log: P.shape({
      condition: P.object,
      logLevel: P.oneOf([LOG_LEVEL_PATHS, LOG_LEVEL_RESULTS]).isRequired
    }),
    preprocessing: P.arrayOf(P.shape({function: P.oneOf([PATH_ANALYSIS, AGGREGATE,
        DERIVE_ASSOCIATIONS, INTERSECT, UNIFY, SUBTRACT, FIRST_FOUND, CREATE_NODE]),
      set: P.oneOfType([P.object, P.string]), [SET_CONTEXT]: P.string, inputSelector: P.object, source: P.oneOfType([P.string, P.array])})),
    colorcoding: P.shape(ColorCoder.propertyTypes),
    options: P.objectOf(P.shape({options: P.arrayOf(P.shape({label: P.string, value: P.any})), default: P.any})),
    elements: P.arrayOf(P.shape(
        {
          key: P.string.isRequired,
          type: P.oneOf(elementTypes).isRequired
        }))
  };

  static validateDescriptor(descriptor) {
    const id = descriptor.id;
    Object.keys(descriptor).forEach(key => {
      if (!Template.propertyTypes[key]) {
        console.warn(`Warning: Template ${id} contains unsupported property ${key}`);
      }
    });
    P.checkPropTypes(Template.propertyTypes, descriptor, id, 'template');
    descriptor.elements.forEach(element => {
      const elementClass = elementClassByType[element.type];
      elementClass.validate(id, element);
    });
  }

  constructor(descriptor) {
    Template.validateDescriptor(descriptor);

    if (descriptor.colorcoding) {
      this.colorCoder = new ColorCoder(descriptor.colorcoding);
    }
    this.id = descriptor.id;
    this.selectable = !descriptor.detailTemplate;
    this.aggregate = descriptor.aggregate;
    this.appliesTo = descriptor.appliesTo;
    this.name = descriptor.name || '';
    this.searchName = this.name.toLowerCase();
    this.descriptor = descriptor;
    this.isDefault = descriptor.isDefault;
  }

  matches(name) {
    return name === this.searchName || (this.isDefault && name === DEFAULT_VIEW_NAME);
  }

  isClickable() {
    return this.descriptor.clickable;
  }

  getDetailTemplateId() {
    return this.descriptor.detailTemplate || this.id;
  }

  getDetailNode() {
    return this.descriptor.detailNode;
  }

  getDefaultOptions() {
    return this.descriptor.options ?
        mapValues(this.descriptor.options, (option) => (option.display === OPTION_HIGHLIGHT ? null : option.defaultValue)) :
        {};
  }

  getElementsForOptions(options) {
    if (this.descriptor.options) {
      const defaultValues = mapValues(this.descriptor.options, option => option.defaultValue);
      return this.descriptor.elements.map(element => fillPlaceholders(element, options || {}, defaultValues));
    }
    return this.descriptor.elements;
  }

  getType() {
    return this.descriptor.type;
  }

  createElementInstance(descriptor, data, highlightCondition, onClick) {
    const elementClass = elementClassByType[descriptor.type];
    if (!elementClass) {
      console.log(`Unsupported element type ${descriptor.type} ignored`);
    }
    if (descriptor.condition && !Filter.fromDescriptor(descriptor.condition).matches(data) ) {
      return null;
    }
    return elementClass.create({descriptor, data, highlightCondition, onClick});
  }

  getCardColor(node) {
    if (node && this.colorCoder) {
      return this.colorCoder.getColor(node);
    } else {
      return this.descriptor.background.color;
    }
  }

  getSize() {
    const {w, h} = (this.descriptor.size || this.descriptor.background);
    if (isNaN(w)|| isNaN(h)) {
      throw new Error(`No size defined for template ${this.descriptor.type}`);
    }
    return { width: w, height: h };
  }

}
