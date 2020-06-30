import P from "prop-types";
import {mapValues, omit} from 'lodash';
import {DEBUG_MODE} from "@/Config";
import {resolveAttribute, TYPE_NODE_COUNT} from "@/graph/Cache";
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

export const Background = function Background(props, color, onClick) {
  const {type, w, h, source, cornerRadius} = props;
  const className =  onClick ? css.clickable : css.background;
  // if (onClick) {console.log(`${JSON.stringify(props)} is clickable`)}
  const spatial = props.spatial || {x: 0, y: 0, scale: 1};

  switch (type) {
    case BACKGROUND_RECT:
      return Div_({key: KEY_BACKGROUND, className, spatial,
        style:{backgroundColor: color, width: w, height: h, borderRadius: cornerRadius},
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
  // console.log(`rendering cardset with ${width}/${height}`);
  switch (type) {
    case GRID:
      const {x, y, w, h, padding, compact } = descriptor;
      return new CompactGridArrangement(padding || PADDING, childSize)
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

// FIXME
function createAggregatedNode(nodes, aggregations) {
  return new Aggregator(aggregations).aggregate(nodes);
}

/**
 *
 * @param {GraphNode || GraphNode[]} data
 * @param {Template} template
 */
const createPreprocessedCardNode = function createPreprocessedCardNode(data, template) {
  const result = createCardNode(data);
  const { preprocessing } = template;
  if (preprocessing) {
    preprocess(result, preprocessing)
  }
  return result;
}

export const ChildSet = function ChildSet(data, descriptor, onClick) {

  if (DEBUG_MODE) {
    P.checkPropTypes(ChildSet.propTypes, descriptor, 'prop', 'ChildSet');
  }

  const { key, source, lod, align, arrangement, x, y, w, h } = descriptor;

  const templateName = descriptor.template;
  const template = TemplateRegistry.getTemplate(templateName);
  const nativeChildSize = template.getSize();

  let nodes = (!source || source === 'this') ?
      data :
      resolveAttribute(data, source);
  if (!nodes) return null;

  if (!Array.isArray(nodes)) {
    const cardNode = createPreprocessedCardNode(nodes, template)
    return Card_({
      key,
      template,
      lod,
      spatial: fit(w, h, nativeChildSize.width, nativeChildSize.height, x, y),
      data:  cardNode,
      onClick
    })._Card;
  }

  const arrangementDescriptor = {type: GRID, x: 0, y: 0, w, h, padding: PADDING, ...arrangement};
  const cardNodes = nodes.map(node => createPreprocessedCardNode(node, template));
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
    onClick})._CardSet
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


