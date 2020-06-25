import P from 'prop-types';
import {resolveAttribute, TYPE_NODES} from "@/graph/Cache";
import Filter from "@/graph/Filter";
import {Svg_} from "@/components/Svg";
import {Rect_} from "@/components/Rect";
import {sum} from "@/Aggregator";
import StackedBarChart from "@/generators/StackedBarChart";
import TemplateRegistry from "@/templates/TemplateRegistry";
import {GraphViz_} from "@/components/GraphViz";
import {DEBUG_MODE} from "@/Config";
import {PolarChart_} from "@/components/PolarChart";

const Chart = function Chart({key, data, descriptor, onClick}) {
  const {chartType, x, y, source, inputSelector, overlay, ...chartProps} = descriptor;

  if (DEBUG_MODE) {
    P.checkPropTypes(Chart.propTypes, descriptor, 'prop', `Chart - ${chartType}`);
  }

  const spatial = { x, y, scale: 1};

  let chartData = (source && source !== 'this') ? resolveAttribute(data, source) : data;
  const filter = inputSelector ? Filter.fromDescriptor(inputSelector): null;
  chartData = filter ? chartData.filter(filter.matches) : chartData;

  if (overlay) {
    if (!Array.isArray(chartData)) {
      throw new Error(`Overlay (${overlay}) only allowed for node sets. ${source} is not a node set`);
    }
    const overlayData = resolveAttribute(data, [overlay,TYPE_NODES]);
    const overlayNodeByKey = {};
    // transform list into map
    overlayData.forEach(node => {overlayNodeByKey[node.getUniqueKey()] = node;})
    // all nodes in overlayData substitute the originals in data
    chartData = chartData.map(node => overlayNodeByKey[node.getUniqueKey()] || node);
  }

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
      return StackedBarChart({data: chartData, spatial, maxValues, ...chartProps, onRectClick: onClick})
    case 'graph':
      const nodeTemplate = TemplateRegistry.getTemplate(descriptor.template);
      return GraphViz_({spatial, startNodes: chartData, ...chartProps, nodeTemplate})._GraphViz;
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