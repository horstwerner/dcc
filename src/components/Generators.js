/**
 * Functions creating Symbiosis components - corresponds to React pure function components
 */

import P from "prop-types";
import {mapValues, omit} from 'lodash';
import {DEBUG_MODE} from "@/Config";
import css from "@/components/Card.css";
import {Div_, FlexBox_} from "@symb/Div";
import {Image_} from "@symb/Image";
import {GRID} from "@/arrangement/GridArrangement";
import Aggregator from "@/Aggregator";
import TemplateRegistry, {DEFAULT_VIEW_NAME} from "@/templates/TemplateRegistry";
import {createCardNode, fit, flexHorizontalAlign, flexVerticalAlign, getNodeArray} from "@symb/util";
import {CardSet_} from "@/components/CardSet";
import {Card_} from "@/components/Card";
import CompactGridArrangement from "@/arrangement/CompactGridArrangement";
import {preprocess} from "@/graph/Preprocessors";
import hoverMenuCss from './HoverCardMenu.css';
import {Link_} from "@/components/Link";
import {TYPE_CONTEXT, TYPE_NODE_COUNT} from "@/graph/TypeDictionary";
import {BLANK_NODE_URI} from "@/components/Constants";

export const STYLE_ATTRIBUTES = [
 'color',
 'background-color',
 'border-radius',
 'font-weight',
 'font-size',
 'padding',
 'z-index',
 'font-family',
 'h-align',
 'v-align'
]

const PADDING = 0.2;
const KEY_BACKGROUND = 'background';

const POSITION_PROPS = {
  x: P.number.isRequired,
  y: P.number.isRequired,
  w: P.number.isRequired,
  h: P.number.isRequired,
};

const CAPTION_PROPS = {
  ...POSITION_PROPS,
  color: P.string,
  text: P.string
};

const BACKGROUND_RECT = 'rect';
const BACKGROUND_IMAGE = 'image';

export const Background = function Background(props, color) {
  const {type, w, h, source, cornerRadius, borderColor} = props;
  const className = css.background;
  const spatial = props.spatial || {x: 0, y: 0, scale: 1};

  switch (type) {
    case BACKGROUND_RECT:
      return Div_({key: KEY_BACKGROUND, className, spatial,
        style:{backgroundColor: color, width: w, height: h, borderRadius: `${cornerRadius}px`, border: borderColor && `solid 1px ${borderColor}`}})._Div;
    case BACKGROUND_IMAGE:
      return Image_({key: KEY_BACKGROUND, className, spatial, source, width: w, height: h, color, cornerRadius})._Image;
    default:
      throw new Error(`Unknown background type: ${type}`);
  }
}

Background.propTypes = {
  type: P.oneOf([BACKGROUND_RECT, BACKGROUND_IMAGE]).isRequired,
  w: P.number.isRequired,
  h: P.number.isRequired,
  source: P.string,
  cornerRadius: P.number
}

export function calcStyle(styleDescriptor) {
  if (!styleDescriptor) return null;
  const result = {};
  Object.keys(styleDescriptor).forEach(key => {
    const value = styleDescriptor[key];
    switch (key) {
      case 'color':
      case 'background-color':
      case 'border-radius':
      case 'font-weight':
      case 'font-size':
      case 'padding':
      case 'z-index':
      case 'font-family':
        result[key] = value;
        break;
      case 'h-align':
        result['text-align'] = value;
        break;
      case 'v-align':
        // ignore silently
        break;
      default:
        console.log(`WARNING: Ignoring unsupported style attribute ${key}`);
    }
  });
  return result;
}

export const Caption = function Caption(props) {

  if (DEBUG_MODE) {
    P.checkPropTypes(Caption.propTypes, props, 'prop', 'Caption');
  }

  const { key, x, y, w, h, text, style } = props;
  let vAlign = 'flex-start';
  let hAlign = 'flex-start';

  if (style) {
    if (style['h-align']) {
      hAlign = flexHorizontalAlign(style['h-align']);
    }
    if (style['v-align']) {
      vAlign = flexVerticalAlign(style['v-align']);
    }
  }

  return FlexBox_({key, className: css.caption, spatial:{ x, y, scale: 1},
        style: { width: w, height: h, justifyContent: hAlign, alignItems: vAlign, zIndex: style && style['z-index'] }
        },
      Div_({key: 'innertext', style: calcStyle({'font-size': h, ...style})}, text)._Div
  )._FlexBox;
}

Caption.propTypes = CAPTION_PROPS;

export const Link = function Link(props) {
  const {key, x, y, w, h, text, image, style, url} = props;

  const child = text ? Div_({key: 'button', size:{width: w, height: h}, style: calcStyle({'font-size': h, ...style})}, text)._Div :
      Image_({key: 'icon', source: image, width: w, height: h, cornerRadius: style && style.cornerRadius})._Image

  return Link_({key, spatial: {x, y, scale: 1}, url}, child)._Link
}


export function createArrangement(descriptor, childSize) {

  if (DEBUG_MODE) {
    P.checkPropTypes(createArrangement.propTypes, descriptor, 'prop', 'createArrangement');
  }

  const { type } = descriptor;
  // console.log(`rendering card set with ${width}/${height}`);
  switch (type) {
    case GRID:
      const {x, y, w, h, padding, maxScale, centerX, centerY } = descriptor;
      return new CompactGridArrangement(padding == null ? PADDING : padding, childSize, maxScale)
          .setArea(w, h)
          .setCenter(centerX, centerY)
          .setOffset(x, y);
  }
}

createArrangement.propTypes = {
  type: P.oneOf([GRID]).isRequired,
  x: P.number.isRequired,
  y: P.number.isRequired,
  w: P.number.isRequired,
  h: P.number.isRequired,
  padding: P.number
}

/**
 *
 * @param {GraphNode || GraphNode[]} data
 * @param {Object} context
 * @param {Template} template
 * @param {string || null} name
 */
export const createPreprocessedCardNode = function createPreprocessedCardNode(data, context, template, name) {
  const result = createCardNode(data,null, name);
  const newContext = context.clone(BLANK_NODE_URI);
  result.set(TYPE_CONTEXT, newContext);
  const { preprocessing } = template.descriptor;
  if (preprocessing) {
    preprocess(result, newContext, preprocessing)
  }
  return result;
}

export const ChildSet = function ChildSet(data, context, descriptor, aggregate, onClick, clickMode) {

  const { key, name, source, lod, align, arrangement, inputSelector, viewName, x, y, w, h, options} = descriptor;

  const nodes = getNodeArray(inputSelector, source, data);
  if (!nodes || nodes.length === 0) return null;

  const templateName = descriptor.template;
  const template = templateName ? TemplateRegistry.getTemplate(templateName) : TemplateRegistry.getTemplateForSingleCard(nodes[0].getTypeUri(), viewName || DEFAULT_VIEW_NAME);
  const nativeChildSize = template.getSize();

  if (aggregate) {
    if (!template) {
      throw new Error(`No template specified for aggregate card ${key} - ${name}`);
    }
    const cardNode = createPreprocessedCardNode(nodes, context, template, name || key);
    return Card_({
      key,
      template,
      lod,
      spatial: fit(w, h, nativeChildSize.width, nativeChildSize.height, x, y),
      data:  cardNode,
      onClick,
      clickMode,
      options
    })._Card;
  }

  const arrangementDescriptor = {type: GRID, x: 0, y: 0, w, h, padding: PADDING, ...arrangement};
  const cardNodes = nodes.map(node => {
    const cardTemplate = template || TemplateRegistry.getTemplateForSingleCard(node.getTypeUri(), viewName || 'default');
    return createPreprocessedCardNode(node, context, cardTemplate,null);
  });
  if (align) {
    // write aggregated information from whole set into each (contextual) card node
    // calculate contains the aggregation formula for each aggregated attribute
    const aggregations = mapValues(align, (calculate, key) => ({attribute: key, calculate}));
    const aligned = omit(new Aggregator(aggregations).aggregate(cardNodes), TYPE_NODE_COUNT);
    cardNodes.forEach(cardNode => Object.assign(cardNode, aligned));
  }

  return CardSet_({key,
    nodes: cardNodes,
    template,
    lod,
    spatial: {x, y, scale: 1},
    arrangement: createArrangement(arrangementDescriptor, nativeChildSize),
    onClick,
    clickMode,
    options})._CardSet
}



const iconSize = 24;
const iconMargin = 6;

export const hoverCardMenu = function hoverCardMenu(key, top, right, onClose, onStash) {

  const width = iconSize;
  const height = iconSize;
  const children = [
    onStash && Image_({key: 'stashbutton', className: hoverMenuCss.icon, width, height, source: 'public/Dock.svg', onClick: onStash})._Image,
    onClose && Image_({key: 'closebutton', className: hoverMenuCss.icon, width, height, source: 'public/CloseButton.svg', onClick: onClose})._Image,
  ].filter(Boolean);
  const totalWidth = children.length * iconSize + (children.length - 1) * iconMargin;

  return Div_({key, className: hoverMenuCss.menu, children, style: {width: totalWidth, height}, spatial: {x: right - totalWidth - iconMargin, y: top -0.7 * iconSize, scale: 1}})._Div
}

export const breadCrumbHoverIcon = function breadCrumbHoverIcon(key, top, right, onClose, onMouseEnter, onMouseLeave) {
  const width = iconSize;
  const height = iconSize;
  return Image_({key, spatial: {x: right - iconSize + 4, y: top - 4, scale: 1},
    className: hoverMenuCss.iconAbsolute, width, height, source: 'public/CloseButton.svg', onClick: onClose, onMouseEnter, onMouseLeave})._Image;
}
