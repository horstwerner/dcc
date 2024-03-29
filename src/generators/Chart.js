import P from 'prop-types';
import {resolveAttribute, resolveProperty} from "@/graph/Cache";
import {Svg_} from "@/components/Svg";
import {Rect_} from "@/components/Rect";
import StackedBarChart from "@/generators/StackedBarChart";
import {GraphViz_} from "@/components/GraphViz";
import {DEBUG_MODE} from "@/Config";
import {PolarChart_} from "@/components/PolarChart";
import {fit, getNodeArray, getUnfilteredNodeArray} from "@symb/util";
import GraphNode from "@/graph/GraphNode";
import {TYPE_NODES} from "@/graph/BaseTypes";
import {Map_} from "@/components/Map";
import {DEFAULT_SPATIAL} from "@symb/Component";
import {LineChart_} from "@/components/LineChart";

const fillInNumber = function fillInNumber(data, valueString) {
  if (isNaN(valueString)) {
    const result = resolveAttribute(data, valueString);
    if (result == null || isNaN(result)) {
      debugger
    } else {
      return result;
    }
  } else {
    return Number(valueString);
  }
}

const Chart = function Chart({data, descriptor, onClick, highlightCondition}) {
  const {key, chartType, x, y, source, inputSelector, overlay, ...chartProps} = descriptor;

  if (DEBUG_MODE) {
    P.checkPropTypes(Chart.propTypes, descriptor, 'prop', `Chart - ${chartType}`);
  }

  const spatial = { x, y, scale: 1};

  let chartData = getNodeArray(inputSelector, source, data);

  if (overlay) {
    if (!Array.isArray(chartData)) {
      throw new Error(`Overlay (${overlay}) only allowed for node sets. ${source} is not a node set`);
    }
    let overlayData = resolveProperty(data, overlay, null, null);

    if (!Array.isArray((overlayData))) {
      if (GraphNode.isGraphNode(overlayData)) {
        overlayData = overlayData.get(TYPE_NODES);
      }  else {
        overlayData = [];
      }
    }
    const overlayNodeByKey = {};
    // transform list into map
    overlayData.forEach(node => {overlayNodeByKey[node.getUniqueKey()] = node;})
    // all nodes in overlayData substitute the originals in data
    chartData = chartData.map(node => overlayNodeByKey[node.getUniqueKey()] || node);
  }

  switch (chartType) {
    case 'rect': {
      const {maxValue, maxW, h, color, attribute} = chartProps;
      const value = resolveAttribute(data, attribute);
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
    }
    case 'stackedBar':
      const {totalWidthValue} = chartProps;
      return StackedBarChart({data: chartData, spatial, totalWidthVal: fillInNumber(data, totalWidthValue), ...chartProps, onRectClick: onClick})
    case 'area':
    case 'stackedArea':
    case 'line':
      const { w, h, series, xAxis, xLabel, yLabel, attributes, colors, maxValue, strokeWidth } = descriptor;
      return LineChart_({display: chartType, width: w, height: h, series: chartData[0].get(series), colors, xAxis,
        spatial, strokeWidth,
        xLabel, yLabel,         attributes, maxValue })._LineChart;
    case 'graph': {
      const {viewName, nodeAspectRatio} = descriptor;
      let scope = null;
      if (descriptor['bounded']) {
        scope = descriptor['bounded'] === 'strict' ? chartData : getUnfilteredNodeArray(source, data);
      }
      const {w, h, canvasW, canvasH, minScale, maxScale} = chartProps;
      const innerSpatial = fit(w, h, canvasW || w, canvasH || h);
      return Map_({spatial,
        innerSpatial,
        size: {width: w, height: h}, minScale, maxScale},
        [GraphViz_({
        spatial: DEFAULT_SPATIAL,
        startNodes: chartData,
        scope, ...chartProps,
        w: canvasW || w,
        h: canvasH || h,
        viewName,
        nodeAspectRatio,
        highlightCondition,
        onNodeClick: onClick
      })._GraphViz])._Map;
    }
    case 'polar':
      return PolarChart_({data, ...chartProps, spatial:{x, y, scale:1}})._PolarChart
    default:
      throw new Error(`Unknown chart type ${chartType}`);
  }
};

Chart.propTypes = {
  chartType: P.string.isRequired,
  x: P.number.isRequired,
  y: P.number.isRequired,
  source: P.string,
  inputSelector: P.shape({}),
  overlay: P.string,
}

export default Chart;