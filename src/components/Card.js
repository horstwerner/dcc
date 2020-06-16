import P from 'prop-types';
import Component from '@symb/Component';
import css from './Card.css';
import {resolveAttribute} from "@/graph/Cache";
import {Div_, FlexBox_} from "@symb/Div";
import isEqual from "lodash/isEqual";
import ComponentFactory from "@symb/ComponentFactory";
import {Image_} from "@symb/Image";
import GridArrangement, {GRID} from "@/arrangement/GridArrangement";
import {CardSet_} from "@/components/CardSet";
import TemplateRegistry from '../templates/TemplateRegistry';
import {fit} from "@symb/util";
import Template from "@/templates/Template";
import Aggregator from "@/Aggregator";
import {Svg_} from "@/components/Svg";
import {Rect_} from "@/components/Rect";
import {StackedBarChart} from "@/components/Generators";

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
          result.margin = 'auto';
        }
    }
  });
  return result;
}

function Chart({key, data, descriptor}) {
  const {chartType, x, y, source, ...chartProps} = descriptor;
  const spatial = { x, y, scale: 1};

  const chartData = (source && source !== 'this') ? resolveAttribute(data, source) : data;

  switch (chartType) {
    case 'rect':
      const {maxValue, maxW, h, color, attribute} = chartProps;
      const value = resolveAttribute(chartData, attribute);
      if (value == null || isNaN(value) || maxValue == null || isNaN(maxValue)) {
        console.log(`Warning: invalid numbers (value=${value}, maxVal=${maxValue}) for rect chart`);
        return null;
      }
      return Svg_({
        key,
        spatial,
        width: maxW,
        height: h,
        children: [Rect_({
          key: 'rect',
          x: 0,
          y: 0,
          width: value / maxValue * maxW,
          height: h,
          style: {fill: color}
        })._Rect]
      })._Svg
    case 'stackedBar':
      return StackedBarChart({data: chartData, spatial, ...chartProps})
    default:
      throw new Error(`Unkonwn chart type ${chartType}`);
  }
}


function Caption(props) {
  const {key, x, y, w, h, text, style} = props;
  return FlexBox_({key, className: css.caption, spatial:{ x, y, scale: 1}, style: {width: w, height: h, justifyContent: (style && style['hAlign']) || 'left'}},
      Div_({key: 'innertext', style: calcStyle(style, h)}, text)._Div
  )._FlexBox;
}

Caption.propTypes = CAPTION_PROPS;

function createArrangement(descriptor, childSize) {

  const { type } = descriptor;
  // console.log(`rendering cardset with ${width}/${height}`);
  switch (type) {
    case GRID:
      const {x, y, w, h, lod, padding } = descriptor;
      return new GridArrangement(padding || PADDING, childSize)
          .setArea(w, h)
          .setOffset(x, y)
          .setLOD(lod)
  }
}

function createAggregatedNode(nodes, descriptor) {
    return new Aggregator(descriptor).aggregate(nodes);
}

function childSetDescriptor(data, set, onClick) {
  const {key, source, lod, aggregate, arrangement, x, y, w, h} = set;
  const templateName = set.template;
  const template = TemplateRegistry.getTemplate(templateName);
  const nativeSize = template.getSize();

  let nodes = source === 'this' ?
      data :
      resolveAttribute(data, source);
  if (!nodes) return null;

  const childData = aggregate? createAggregatedNode(nodes, aggregate) : nodes;

  if (!Array.isArray(childData)) {
    return Card_({
      key,
      template,
      lod,
      spatial: fit(w, h, nativeSize.width, nativeSize.height, x, y),
      data:  childData,
      onClick
    })._Card;
  }
  return CardSet_({key,
    nodes: childData,
    template,
    lod,
    spatial: {x: 0, y: 0, scale: 1},
    arrangement: createArrangement(arrangement, nativeSize),
    onClick})._CardSet
}



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
    // const tween = new Tween(DURATION_REARRANGEMENT);
    // this.morph(clickAction, tween);
    // tween.start();
  }

  /**
   * map from template to symb component descriptors
   * @param props
   */
  updateContents(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }
    this.innerProps = props;

    const {template, data, onClick} = props;
    const {background, elements} = template;
    const color = template.getCardColor(data);

    const children = [Background(background, color, onClick ?  () => onClick(this) : null)];
    elements.forEach(element => {
      const { key } = element;
      switch (element.type) {
        case 'caption':
          children.push(Caption({key: element.text, ...element}));
          break;
        case 'textfield': {
          const {attribute, ...rest} = element;
          children.push(Caption({
            key: attribute,
            text: String(resolveAttribute(data, attribute)),
            ...rest
          }));
          }
          break;
        case "chart":
          children.push(Chart({key, data, descriptor: element}));
          break;
        case "childcards":
          this.childClickAction[element.key] = element.clickAction;
          children.push(childSetDescriptor(data, element,
              element.clickAction ? () => {this.handleChildClick(key, element.clickAction)} : null));
          break;
        default:
          throw new Error(`Unsupported Element type: ${element.type}`);
      }
    });

    this.createChildren(children);
    //TODO: remove dependency to 'root' literal
    this.updateStyle({...this.style, width: background.w, height: background.h, pointerEvents: onClick || template.type === 'root' ? '': 'none'});
  };

  // morph(arrangementName, tween, onClick) {
  //   const { template, data } = this.innerProps;
  //   const stateDescriptor = template.arrangements[arrangementName];
  //   if (!stateDescriptor) {
  //     throw new Error(`Template ${template.type} has no state ${arrangementName}`);
  //   }
  //   const { elements } = template;
  //   const { layout } = stateDescriptor;
  //   const color = template.colorCoder ? template.colorCoder.getColor(data): null;
  //
  //   // update background with new onClick method, but make sure not to change spatial position
  //   const spatial = this.childByKey[KEY_BACKGROUND].getSpatial();
  //   this.updateChild(KEY_BACKGROUND,
  //       Background({...template.background, spatial}, color, onClick));
  //   Object.keys(layout).forEach(key => {
  //     const element = this.childByKey[key];
  //     const elementState = layout[key];
  //     const position = template.getChildProps(key, arrangementName);
  //     if (element.constructor === CardSet) {
  //       const childTemplate = TemplateRegistry.getTemplate(find(elements, {key}).template);
  //       const childSize = childTemplate.getSize();
  //       const setArrangement = createArrangement(elementState.arrangement, childSize);
  //       element.updateArrangement(setArrangement, tween);
  //     } else {
  //       const {x, y, w, h, alpha, arrangement, clickAction} = elementState;
  //       const native = element.getNativeSize(arrangement);
  //       if (x!= null && y != null && w!= null && h != null) {
  //         const spatial = fit(w, h, native.width, native.height, x, y);
  //         tween.addTransform(element, spatial.x, spatial.y, spatial.scale);
  //       }
  //       if (alpha != null) {
  //         tween.addFade(element, alpha);
  //       }
  //       if (element.constructor === Card) {
  //         element.morph(elementState.arrangement, tween,
  //             clickAction ? () => {this.handleChildClick(key, clickAction)} : null);
  //         if (elementState.clickAction) {
  //           this.childClickAction[element.key] = elementState.clickAction;
  //         }
  //       }
  //     }
  //   });
  // }

  getNativeSize() {
    const { template } = this.innerProps;
    return template.getSize();
  }

}

ComponentFactory.registerType(Card);

export const Card_ = (props) => ({_Card: {type: CARD, ...props}});

