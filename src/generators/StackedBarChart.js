import {DEBUG_MODE} from "@/Config";
import P from "prop-types";
import ColorCoder from "@symb/ColorCoder";
import {resolveAttribute} from "@/graph/Cache";
import {Rect_} from "@/components/Rect";
import {Svg_} from "@/components/Svg";
import GraphNode from "@/graph/GraphNode";

const SORT_ASC = 'asc';
const SORT_DESC = 'desc';
const SORT_URI = 'byUri';

const strcmp = function(a, b) {
  return (a < b ? -1 : ( a > b ? 1 : 0));
}

const StackedBarChart = function StackedBarChart(props) {
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
    return Rect_({id: node.uri, value: node.colorVal, x, y: 0, width: node.width + 1, height: h-2, style: { stroke: fragmentStroke, fill: colorCoder.getColor(node)}})._Rect;
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

export default StackedBarChart;