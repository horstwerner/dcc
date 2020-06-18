import P from "prop-types";
import {mapValues} from "lodash";
import GraphNode from "@/graph/GraphNode";
import ColorCoder from "@symb/ColorCoder";
import {DEBUG_MODE} from "@/Config";
import {resolveAttribute, TYPE_NODE_COUNT, TYPE_NODES} from "@/graph/Cache";
import {Rect_} from "@/components/Rect";
import {Svg_} from "@/components/Svg";
import css from "@/components/Card.css";
import {Div_, FlexBox_} from "@symb/Div";
import {Image_} from "@symb/Image";
import GridArrangement, {GRID} from "@/arrangement/GridArrangement";
import Aggregator, {AGG_MAX, AGG_MIN, aggregateNodes, DEFAULT_AGGREGATOR, sum} from "@/Aggregator";
import TemplateRegistry from "@/templates/TemplateRegistry";
import {fit, flexContentAlign} from "@symb/util";
import {CardSet_, LOD_FULL, LOD_RECT} from "@/components/CardSet";
import {Card_} from "@/components/Card";
import {sliceBy} from "@/graph/GroupedSet";

const SORT_ASC = 'asc';
const SORT_DESC = 'desc';
const SORT_URI = 'byUri';

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

const strcmp = function(a, b) {
  return (a < b ? -1 : ( a > b ? 1 : 0));
}

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

//TODO: separate generators
export const Chart = function Chart({key, data, descriptor}) {

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
      const {totalWidthAttribute, widthAttribute} = chartProps;
      const maxValues = data.maxValues || {[totalWidthAttribute]: widthAttribute ? sum(chartData, widthAttribute) : chartData.count}
      return StackedBarChart({data: chartData, spatial, maxValues, ...chartProps})
    default:
      throw new Error(`Unknown chart type ${chartType}`);
  }
}

export const Caption = function Caption(props) {

  if (DEBUG_MODE) {
    P.checkPropTypes(Caption.propTypes, props, 'prop', 'Caption');
  }

  const {key, x, y, w, h, text, style} = props;
  return FlexBox_({key, className: css.caption, spatial:{ x, y, scale: 1}, style: {width: w, height: h, justifyContent: (style && flexContentAlign(style['h-align'])) || 'left'}},
      Div_({key: 'innertext', style: calcStyle(style, h)}, text)._Div
  )._FlexBox;
}

Caption.propTypes = CAPTION_PROPS;


function createArrangement(descriptor, childSize) {

  if (DEBUG_MODE) {
    P.checkPropTypes(createArrangement.propTypes, descriptor, 'prop', 'createArrangement');
  }

  const { type } = descriptor;
  // console.log(`rendering cardset with ${width}/${height}`);
  switch (type) {
    case GRID:
      const {x, y, w, h, padding, compact } = descriptor;
      return new GridArrangement(padding || PADDING, childSize)
          .setArea(w, h)
          .setOffset(x, y)
          .setCompact(compact)
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


function createAggregatedNode(nodes, aggregations) {
  return new Aggregator(aggregations).aggregate(nodes);
}

export const ChildSet = function ChildSet(data, descriptor, onClick) {

  if (DEBUG_MODE) {
    P.checkPropTypes(ChildSet.propTypes, descriptor, 'prop', 'ChildSet');
  }

  const { key, source, lod, aggregate, arrangement, x, y, w, h } = descriptor;

  const templateName = descriptor.template;
  const template = TemplateRegistry.getTemplate(templateName);
  const nativeChildSize = template.getSize();

  let nodes = source === 'this' ?
      data :
      resolveAttribute(data, source);
  if (!nodes) return null;

  const childData = aggregate ? createAggregatedNode(nodes, aggregate) : nodes;

  if (!Array.isArray(childData)) {
    return Card_({
      key,
      template,
      lod,
      spatial: fit(w, h, nativeChildSize.width, nativeChildSize.height, x, y),
      data:  childData,
      onClick
    })._Card;
  }

  const arrangementDescriptor = {type: GRID, x: 0, y: 0, w, h, padding: PADDING, ...arrangement};

  return CardSet_({key,
    nodes: childData,
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

export const Trellis = function Trellis(data, descriptor, onClick) {

  if (DEBUG_MODE) {
    P.checkPropTypes(Trellis.propTypes, descriptor, 'prop', 'Trellis');
  }

  const {key, source, groupAttribute, aggregate, texts, arrangement, x, y, w, h} = descriptor;
  const templateName = descriptor.template;
  const template = TemplateRegistry.getTemplate(templateName);

  const nativeChildSize = template.getSize();

  const aggregator = aggregate ? new Aggregator(aggregate) : DEFAULT_AGGREGATOR;
  let nodes = resolveAttribute(data, source);
  if (!nodes) return null;

  const aggregated = aggregator.aggregate(nodes);
  const groupedSet = sliceBy(aggregated, groupAttribute, aggregator);

  const childSets = groupedSet
      .getKeys()
      .sort()
      .map(key => groupedSet.getGroup(key));

  const aggregatedAttributeNames = [...aggregator.getAggregatedAttributeNames()];
  aggregatedAttributeNames.push(TYPE_NODE_COUNT);

  const minAggregations = aggregatedAttributeNames.map(name => ({sourceField: name, targetField: `min-${name}`, method: AGG_MIN}));
  const maxAggregations = aggregatedAttributeNames.map(name => ({sourceField: name, targetField: `max-${name}`, method: AGG_MAX}));
  const bracketAggregation = aggregateNodes(childSets, [...minAggregations, ...maxAggregations]);

  const minValues = {};
  const maxValues = {};
  aggregatedAttributeNames.forEach(name => {
    minValues[name] = bracketAggregation[`min-${name}`];
    maxValues[name] = bracketAggregation[`max-${name}`];
  })
  childSets.forEach(aggNode => aggNode.setAttributes({minValues, maxValues}));

  const arrangementDescriptor = {type: GRID, x: 0, y: 0, w, h, padding: PADDING, ...arrangement};

  return CardSet_({key,
    nodes: childSets,
    template,
    lod: LOD_FULL,
    spatial: {x, y, scale: 1},
    arrangement: createArrangement(arrangementDescriptor, nativeChildSize),
    onClick})._CardSet

}

Trellis.propTypes = {
  ...ChildSet.propTypes,
  groupAttribute: P.string
}


export const StackedBarChart = function StackedBarChart(props) {
  if (DEBUG_MODE) {
    P.checkPropTypes(StackedBarChart.propTypes, props, 'prop', 'StackedBarChart');
  }

  const {data, spatial, w, h, maxValues, colorAttribute, widthAttribute, totalWidthAttribute, colors, defaultColor, fragmentStroke, sortSequence} = props;
  const colorCoder = new ColorCoder({type: 'selection', attribute: 'colorVal', cases: colors, default: defaultColor});

  const maxValue = maxValues[totalWidthAttribute];
  if (!maxValue) {
    return null;
  }

  // create copy with only needed values for sorting
  const nodes = data.map(node => {
    const colorVal= resolveAttribute(node, colorAttribute);
    const width = (widthAttribute ? (resolveAttribute(node, widthAttribute) || 0) : 1)/ maxValue * w;
    return {uri: node.uri, colorVal, width};
  });


  let rankLookup = {};
  let compare;
  if (sortSequence === SORT_ASC) {
    compare = (a, b) => a.colorVal - b.colorVal;
  } else if (sortSequence === SORT_DESC) {
    compare = (a, b) => b.colorVal - a.colorVal;
  } else if (sortSequence === SORT_URI) {
    compare = (a, b) => strcmp(a.uri, b.uri)
  } else {
    for (let idx = 0; idx < sortSequence.length; idx++) {
      rankLookup[sortSequence[idx]] = idx;
    }
    compare = (a, b) => rankLookup[a.colorVal] - rankLookup[b.colorVal];
  }
  nodes.sort(compare);
  let xCursor = 0;
  const children = nodes.map(node => {
    const x = xCursor;
    xCursor += node.width;
    return Rect_({x, y: 0, width: node.width + 1, height: h-2, style: {stroke: fragmentStroke, fill: colorCoder.getColor(node)}})._Rect;
  });

  return Svg_({width: w, height: h, children, spatial})._Svg;
};

StackedBarChart.propTypes = {
  data: P.arrayOf(P.instanceOf(GraphNode)).isRequired,
  spatial: P.shape({x: P.number.isRequired, y: P.number.isRequired, scale: P.number.isRequired}).isRequired,
  w: P.number.isRequired,
  h: P.number.isRequired,
  maxValues: P.objectOf(P.number).isRequired,
  colorAttribute: P.string,
  widthAttribute: P.string,
  totalWidthAttribute: P.string,
  colors: P.arrayOf(P.shape({condition: P.string.isRequired, color: P.string.isRequired})),
  fragmentStroke: P.string,
  defaultColor: P.string,
  sortSequence: P.oneOfType([P.oneOf([SORT_ASC, SORT_DESC, SORT_URI]), P.array])
}