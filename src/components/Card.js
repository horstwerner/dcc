import P from 'prop-types';
import Component from '@symb/Component';
import css from './Card.css';
import {resolveAttribute} from "../graph/Cache";
import {Div_, FlexBox_} from "@symb/Div";
import find from "lodash/find";
import isEqual from "lodash/isEqual";
import ComponentFactory from "@symb/ComponentFactory";
import {Image_} from "@symb/Image";
import GridArrangement, {GRID} from "@/arrangement/GridArrangement";
import {CardSet_} from "@/components/CardSet";
import TemplateRegistry, {ARRANGEMENT_DEFAULT} from '../templates/TemplateRegistry';
import CardSet from "@/components/CardSet";
import {fit} from "@symb/util";
import GraphNode from "@/graph/GraphNode";
import {DURATION_REARRANGEMENT} from "@/Config";
import Tween from "@/arrangement/Tween";
import Template from "@/templates/Template";

const CARD = 'card';
const PADDING = 0.2;
export const KEY_BACKGROUND = 'background';

const POSITION_PROPS = {
  x: P.number.isRequired,
  y: P.number.isRequired,
  w: P.number.isRequired,
  h: P.number.isRequired,
};

export const CAPTION_PROPS = {
  ...POSITION_PROPS,
  color: P.string,
  text: P.string
};

export const TEXT_PROPS = {
  ...POSITION_PROPS,
  color: P.string,
  attribute: P.string.isRequired
};

const BACKGR_RECT = 'rect';
const BACKGR_IMAGE = 'image';
export const BACKGR_SHAPE = P.shape({type: P.oneOf([BACKGR_RECT, BACKGR_IMAGE]), color: P.string});

function Background(props, color, onClick) {
  const {type, w, h, source, cornerRadius} = props;
  const className =  onClick ? css.clickable : css.background;
  // if (onClick) {console.log(`${JSON.stringify(props)} is clickable`)}
  const spatial = props.spatial || {x: 0, y: 0, scale: 1};

  switch (type) {
    case BACKGR_RECT:
      return Div_({key: KEY_BACKGROUND, className, spatial,
        style:{backgroundColor: color, width: w, height: h, borderRadius: cornerRadius},
        onClick})._Div;
    case BACKGR_IMAGE:
      return Image_({key: KEY_BACKGROUND, className, spatial, source, width: w, height: h, color, cornerRadius, onClick})._Image;
    default:
      throw new Error(`Unknown background type: ${type}`);
  }
}

function calcStyle(styleDescriptor, h) {
  if (!styleDescriptor) return null;
  const result = { fontSize: h};
  Object.keys(styleDescriptor).forEach(key => {
    const value = styleDescriptor[key];
    switch (key) {
      case 'color':
      case 'font-weight':
      case 'font-size':
        result[key] = value;
        break;
      case 'h-align':
        if (value === 'center') {
          result.msrgin = 'auto';
        }
    }
  });
  return result;
}

function Caption(props) {
  const {key, x, y, w, h, text, style} = props;
  return FlexBox_({key, className: css.caption, spatial:{ x, y, scale: 1}, style: {width: w, height: h, justifyContent: 'center'}},
      Div_({key: 'innertext', style:calcStyle(style, h)}, text)._Div)._FlexBox;
}

function createArrangement(descriptor, childSize) {

  const { type } = descriptor;
  // console.log(`rendering cardset with ${width}/${height}`);
  switch (type) {
    case GRID:
      const {x, y, w, h } = descriptor;
      return new GridArrangement(PADDING, childSize)
          .setArea(w, h)
          .setOffset(x, y)
  }
}

function createAggregatedNode(nodes, descriptor) {
    const result = { nodes };
    const { title } = descriptor;
    if (title) {
      result.title = `${title} (${nodes.length})`;
    }
    return result;
}

function childSetDescriptor(data, set, onClick) {
  const {key, source, aggregate, arrangement, x, y, w, h} = set;
  const templateName = set.template;
  const template = TemplateRegistry.getTemplate(templateName);
  const childSize = template.getSize();

  let nodes = source === 'this' ?
      data :
      resolveAttribute(data, source);
  if (!nodes) return null;

  if (aggregate) {
    nodes = createAggregatedNode(nodes, aggregate);
  }

  if (!Array.isArray(nodes)) {
    return Card_({
      key,
      template,
      spatial: fit(w, h, childSize.width, childSize.height, x, y),
      data:  nodes,
      onClick
    })._Card;
  }
  return CardSet_({key,
    nodes,
    template,
    arrangement: createArrangement(arrangement, childSize),
    onClick})._CardSet
}

Caption.propTypes = CAPTION_PROPS;

export default class Card extends Component {

  static type = CARD;
  // noinspection JSUnusedGlobalSymbols
  static baseTag = 'div';
  static className = css.card;

  // noinspection JSUnusedGlobalSymbols
  static propTypes = {
    template: P.instanceOf(Template),
    arrangement: P.string,
    data: P.object
  };

  constructor(descriptor, domNode) {
    super(descriptor, domNode);
    this.childClickAction = {};
  }

  getTemplate() {
    return this.innerProps.template;
  }

  updateChildClickAction(key, action) {
    this.childClickAction[key] = action;
  }

  handleChildClick(childKey, clickAction) {
    const tween = new Tween(DURATION_REARRANGEMENT);
    this.morph(clickAction, tween);
    tween.start();
  }

  updateContents(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }
    this.innerProps = props;

    const {template, arrangement, data, onClick} = props;
    const {background, elements} = template;
    const color = template.colorCoder ? template.colorCoder.getColor(data): null;

    const children = [Background(background, color, onClick ?  () => onClick(this) : null)];
    elements.forEach(element => {
      const { key } = element;
      const childState = template.getChildState(key, arrangement);
      switch (element.type) {
        case 'caption':
          children.push(Caption({key: element.text, ...element, ...childState}));
          break;
        case 'textfield': {
          const {attribute, ...rest} = element;
          children.push(Caption({
            key: attribute,
            text: resolveAttribute(data, attribute),
            ...rest,
            ...childState
          }));
          }
          break;
        case "childcards":
          this.childClickAction[element.key] = element.clickAction;
          children.push(childSetDescriptor(data,{...element, ...childState},
              element.clickAction ? () => {this.handleChildClick(key, element.clickAction)} : null));
          break;
        default:
          throw new Error(`Unsupported Element type: ${element.type}`);
      }
    });

    this.createChildren(children);
    this.updateStyle({...this.style, width: background.w, height: background.h, pointerEvents: onClick || template.type === 'root' ? '': 'none'});
  };

  morph(arrangementName, tween, onClick) {
    const { template, data } = this.innerProps;
    const stateDescriptor = template.arrangements[arrangementName];
    if (!stateDescriptor) {
      throw new Error(`Template ${template.type} has no state ${arrangementName}`);
    }
    const { elements } = template;
    const { layout } = stateDescriptor;
    const color = template.colorCoder ? template.colorCoder.getColor(data): null;

    // update background with new onClick method, but make sure not to change spatial position
    const spatial = this.childByKey[KEY_BACKGROUND].getSpatial();
    this.updateChild(KEY_BACKGROUND,
        Background({...template.background, spatial}, color, onClick));
    Object.keys(layout).forEach(key => {
      const element = this.childByKey[key];
      const elementState = layout[key];
      const position = template.getChildState(key, arrangementName);
      if (element.constructor === CardSet) {
        const childTemplate = TemplateRegistry.getTemplate(find(elements, {key}).template);
        const childSize = childTemplate.getSize();
        const setArrangement = createArrangement(elementState.arrangement, childSize);
        element.updateArrangement(setArrangement, tween);
      } else {
        const {x, y, w, h, alpha, arrangement, clickAction} = elementState;
        const native = element.getNativeSize(arrangement);
        if (x!= null && y != null && w!= null && h != null) {
          const spatial = fit(w, h, native.width, native.height, x, y);
          tween.addTransform(element, spatial.x, spatial.y, spatial.scale);
        }
        if (alpha != null) {
          tween.addFade(element, alpha);
        }
        if (element.constructor === Card) {
          element.morph(elementState.arrangement, tween,
              clickAction ? () => {this.handleChildClick(key, clickAction)} : null);
          if (elementState.clickAction) {
            this.childClickAction[element.key] = elementState.clickAction;
          }
        }
      }
    });
  }

  getNativeSize(arrangementName) {
    const { template } = this.innerProps;
    return template.getSize(arrangementName);
  }

}

ComponentFactory.registerType(Card);

export const Card_ = (props) => ({_Card: {type: CARD, ...props}});

