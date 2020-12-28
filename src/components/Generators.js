/**
 * Functions creating Symbiosis components - corresponds to React pure function components
 */

import P from "prop-types";
import {resolve, TYPE_CONTEXT, TYPE_NODE_COUNT} from '@/graph/Cache';
import {mapValues, omit} from 'lodash';
import {DEBUG_MODE} from "@/Config";
import css from "@/components/Card.css";
import {Div_, FlexBox_} from "@symb/Div";
import {Image_} from "@symb/Image";
import {GRID} from "@/arrangement/GridArrangement";
import Aggregator from "@/Aggregator";
import TemplateRegistry from "@/templates/TemplateRegistry";
import {createCardNode, fit, flexContentAlign} from "@symb/util";
import {CardSet_, LOD_FULL, LOD_RECT} from "@/components/CardSet";
import {Card_} from "@/components/Card";
import CompactGridArrangement from "@/arrangement/CompactGridArrangement";
import {preprocess} from "@/graph/Preprocessors";
import hoverMenuCss from './HoverCardMenu.css';

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

export const Background = function Background(props, color, onClick, hover) {
  const {type, w, h, source, cornerRadius, borderColor} = props;
  const className =  hover ? css.hovering : (onClick ? css.clickable : css.background);
  const spatial = props.spatial || {x: 0, y: 0, scale: 1};

  switch (type) {
    case BACKGROUND_RECT:
      return Div_({key: KEY_BACKGROUND, className, spatial,
        style:{backgroundColor: color, width: w, height: h, borderRadius: cornerRadius, border: borderColor && `solid 1px ${borderColor}`},
        onClick})._Div;
    case BACKGROUND_IMAGE:
      return Image_({key: KEY_BACKGROUND, className, spatial, source, width: w, height: h, color, cornerRadius, onClick})._Image;
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

function calcStyle(styleDescriptor, h) {
  if (!styleDescriptor) return null;
  const result = { fontSize: h};
  Object.keys(styleDescriptor).forEach(key => {
    const value = styleDescriptor[key];
    switch (key) {
      case 'color':
      case 'font-weight':
      case 'font-size':
      case 'font-family':
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

export const Caption = function Caption(props) {

  if (DEBUG_MODE) {
    P.checkPropTypes(Caption.propTypes, props, 'prop', 'Caption');
  }

  const {key, x, y, w, h, text, style} = props;
  return FlexBox_({key, className: css.caption, spatial:{ x, y, scale: 1}, style: {width: w, height: h, justifyContent: (style && flexContentAlign(style['h-align'])) || 'flex-start'}},
      Div_({key: 'innertext', style: calcStyle(style, h)}, text)._Div
  )._FlexBox;
}

Caption.propTypes = CAPTION_PROPS;


export function createArrangement(descriptor, childSize) {

  if (DEBUG_MODE) {
    P.checkPropTypes(createArrangement.propTypes, descriptor, 'prop', 'createArrangement');
  }

  const { type } = descriptor;
  // console.log(`rendering card set with ${width}/${height}`);
  switch (type) {
    case GRID:
      const {x, y, w, h, padding } = descriptor;
      return new CompactGridArrangement(padding == null ? PADDING : padding, childSize)
          .setArea(w, h)
          .setOffset(x, y)
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
 */
export const createPreprocessedCardNode = function createPreprocessedCardNode(data, context, template) {
  const result = createCardNode(data);
  const newContext = {...context};
  result[TYPE_CONTEXT] = newContext;
  const { preprocessing } = template;
  if (preprocessing) {
    preprocess(result, newContext, preprocessing)
  }
  return result;
}

export const ChildSet = function ChildSet(data, context, descriptor, aggregate, onClick, clickMode) {

  if (DEBUG_MODE) {
    P.checkPropTypes(ChildSet.propTypes, descriptor, 'prop', 'ChildSet');
  }

  const { key, source, lod, align, arrangement, x, y, w, h, options} = descriptor;

  const templateName = descriptor.template;
  const template = TemplateRegistry.getTemplate(templateName);
  const nativeChildSize = template.getSize();

  let nodes;
  if (!source || source === 'this') {
    nodes = data;
  } else {
    nodes = resolve(data, source);
  }

  if (!nodes) return null;

  if (aggregate) {
    const cardNode = createPreprocessedCardNode(nodes, context, template)
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
  const cardNodes = nodes.map(node => createPreprocessedCardNode(node, context, template));
  if (align) {
    const aggregate = mapValues(align, (calculate, key) => ({attribute: key, calculate}));
    const aligned = omit(new Aggregator(aggregate).aggregate(cardNodes), TYPE_NODE_COUNT);
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

ChildSet.propTypes = {key: P.string.isRequired,
  source: P.string.isRequired,
  lod: P.oneOf([LOD_FULL, LOD_RECT]),
  aggregate: P.shape({}),
  arrangement: P.shape({type: P.oneOf[GRID], lod: P.string, padding: P.number}),
  x: P.number.isRequired,
  y: P.number.isRequired,
  w: P.number.isRequired,
  h: P.number.isRequired,
  template: P.string.isRequired
}

export const hoverCardMenu = function hoverCardMenu(key, top, right, onClose, onStash) {
  const iconSize = 18;
  const iconMargin = 6;
  const width = iconSize;
  const height = iconSize;
  const children = [
    onStash && Image_({className: hoverMenuCss.icon, width, height, source: 'public/Dock.svg', onClick: onStash})._Image,
    onClose && Image_({className: hoverMenuCss.icon, width, height, source: 'public/CloseButton.svg', onClick: onClose})._Image,
  ].filter(Boolean);
  const totalWidth = children.length * iconSize + (children.length - 1) * iconMargin;

  return Div_({key, className: hoverMenuCss.menu, children, style: {width: totalWidth, height}, spatial: {x: right - totalWidth - iconMargin, y: top + iconMargin, scale: 1}})._Div
}
