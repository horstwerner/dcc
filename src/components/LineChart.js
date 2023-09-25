import P from 'prop-types';
import last from 'lodash/last';
import TypeDictionary from '@/graph/TypeDictionary';
import Component from "@symb/Component";
import {Svg_} from "@/components/Svg";
import {Path_} from "@/components/Path";
import {arrowPaths, polygonPath} from "@symb/util";
import ComponentFactory from "@symb/ComponentFactory";
import css from './LineChart.css';
import {Div_} from "@symb/Div";

const LINECHART = 'linechart';

const defaultColors = ['red', 'green', 'blue', 'yellow'];

const legendEntry = function legendEntry(attribute, color) {
  return [
    Div_({id: `series${attribute}Color`, style: {width: 10, height: 10, backgroundColor: color}})._Div,
    Div_({id: `series${attribute}Label`, style: {fontSize: '10px', marginRight: '6px'}}, TypeDictionary.getType(attribute).name)._Div
  ]
}

class LineChart extends Component {

  static type = LINECHART;

  static className = css.lineChart;

  static propTypes = {
    display: P.oneOf(['line', 'area', 'stackedArea']),
    width: P.number.isRequired,
    height: P.number.isRequired,
    series: P.object.isRequired,
    colors: P.arrayOf(P.string),
    strokeWidth: P.number,
    xLabel: P.string,
    yLabel: P.string,
    spatial: P.shape({x: P.number, y: P.number}),
    maxValue: P.number,
    attributes: P.arrayOf(P.string).isRequired,
  }

  createChildDescriptors(props) {

    const { display, series, xAxis, attributes, width, height, colors, strokeWidth, maxValue, yLabel, xLabel} = props;
    const arrowTipLength = 10;
    const legendWidth = 80;
    const netWidth = width - legendWidth - arrowTipLength - 2;
    const legendHeight = 24;
    const netHeight = height - legendHeight - arrowTipLength - 12;
    const lineTop = arrowTipLength + 13;

    const xValues = series[xAxis];
    if (xValues.length < 2) return null;

    const xRange = last(xValues) - xValues[0];
    const xScale = netWidth / xRange;

    let maxY;

    if (!maxValue) {
      maxY = -Number.MAX_VALUE;
      for (let i = 0; i < xValues.length; i++) {
        let sum = 0;
        for (let att of attributes) {
          const value = Math.max(0, series[att][i]);
          sum += value;
          if (value > maxY) {
            maxY = value;
          }
        }
        if (display === 'stackedArea' && sum > maxY) {
          maxY = sum;
        }
      }
    } else {
      maxY = maxValue;
    }

    const yScale = (netHeight - 1) / maxY;

    const renderColors = colors || defaultColors;
    const labelChildren = [
      Div_({id: 'seriesLabels', className: css.label, spatial: {x: legendWidth + 12, y: 6, scale: 1},
        style: {fontSize: '10px', width: width - legendWidth - 12, display: 'flex', gap: '8px'},
        children: yLabel || attributes.flatMap((att, idx) => legendEntry(att, renderColors[idx]))})._Div,
      Div_({id: 'xLabel', spatial: {x: width - 128, y: height - legendHeight + 8 , scale: 1},
        style: {fontSize: '10px', width: 120, className: css.label, textAlign: 'right'},
        children: xLabel || TypeDictionary.getType(xAxis).name})._Div,
      Div_({id: 'maxNumber', className: css.label, spatial: {x: 0, y: lineTop - 6 , scale: 1},
        style: {lineHeight: '10px', top: 0, fontSize: '10px', width: legendWidth - 12, textAlign: 'right'},
        children: String(maxY)})._Div
    ];

    let children = [
    ];
    let colorIndex = 0;
    switch (display) {
      case 'line':
      case 'area':
        for (let att of attributes) {
          const corners = xValues.map((x, i) => ({x: x * xScale + legendWidth,
            y: height - series[att][i] * yScale - legendHeight}));
          if (display === 'area') {
            corners.push({x: legendWidth + netWidth, y: height - legendHeight});
            corners.push({x: legendWidth, y: height - legendHeight})
          }
          children.push(Path_({id: `line-${att}`, d: polygonPath(corners, display === 'area'),
            stroke: display === 'area' ? renderColors[colorIndex]: undefined,
            fill: display === 'area' ? renderColors[colorIndex] : 'none',
            strokeWidth: display === 'area' ? 0 : strokeWidth
          })._Path);
          colorIndex = (colorIndex + 1) % renderColors.length;
        }
        break;
      case 'stackedArea':
        const offset = xValues.map(() => 0);
        for (let att of attributes) {
          const corners = xValues.map((x, i) => {
            const y = series[att][i] * yScale + offset[i];
            offset[i] = y;
            return {x: x * xScale + legendWidth, y: height - y - legendHeight};
          });

          corners.push({x: legendWidth + netWidth, y: height - legendHeight});
          corners.push({x: legendWidth, y: height - legendHeight})
          children.push(Path_({
            id: `line-${att}`, d: polygonPath(corners, display === 'area'),
            fill: renderColors[colorIndex]
          })._Path);
          colorIndex = (colorIndex + 1) % renderColors.length;
        }
        children.reverse();
        break;
    }

    children.push(...arrowPaths('y', {x: legendWidth, y: height - legendHeight}, {x: legendWidth, y: 0},
        arrowTipLength, '#404040', 1 ).map(x => Path_(x)._Path),
      ...arrowPaths('x', {x: legendWidth, y: height - legendHeight}, {x: width, y: height - legendHeight},
        arrowTipLength, '#404040', 1 ).map(x => Path_(x)._Path),
        Path_({d: `M${legendWidth - 8} ${lineTop}h${netWidth + 12}`, strokeWidth: 1, stroke: 'rgba(0,0,0,0.4)'})._Path
      );

    return [Svg_({width, height, children, overflow: 'visible'})._Svg, ...labelChildren];
  }

}

ComponentFactory.registerType(LineChart);

export const LineChart_ = (props) => ({_LineChart: {...props, type: LINECHART}});
