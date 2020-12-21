import P from 'prop-types';
import Cache from '@/graph/Cache';
import Component from "@symb/Component";
import GraphNode from "@/graph/GraphNode";
import {RADIAL_GRADIENT, Stop, Svg_} from "@/components/Svg";
import {Path_} from "@/components/Path";
import {polygonPath, rotate, translate} from "@symb/util";
import ComponentFactory from "@symb/ComponentFactory";
import {Caption} from "@/components/Generators";

const POLAR = 'polar';
// const FILL_GRADIENT = 'fillGradient';

// const rad = function rad(angle) {
//   return angle / 180 * Math.PI;
// }

class PolarChart extends Component {

  static type = POLAR;

  static propTypes = {
    data: P.instanceOf(GraphNode),
    maxValues: P.shape({}).isRequired,
    dimensions: P.arrayOf(P.string).isRequired,
    diameter: P.number.isRequired,
    labels: P.arrayOf(P.string),
    labelStyle: P.shape({}),
    colorStops: P.arrayOf(P.shape(Stop.propTypes)).isRequired,
  }

  createChildDescriptors(props) {

    const {data, maxValues, dimensions, labels, labelStyle, diameter, colorStops} = props;

    const fillId = `grad${Math.floor(100000 * Math.random())}`;

    const radius = diameter * 0.8 / 2;
    const center = {x: diameter / 2, y: diameter / 2};

    const defs = [
      {id:fillId, type: RADIAL_GRADIENT, cx: center.x, cy: center.y, radius, stops: colorStops}
    ];

    const halfBase = diameter * 0.01;
    const arrowLen = 4 * halfBase;
    const arrowTip = [{x: 0, y:  -halfBase}, {x: 0, y: halfBase}, {x: arrowLen, y: 0}];
    const lineRadius = 0.5 * diameter * 0.92;

    const labelHeight = 0.08 * diameter;
    const labelWidth = 3.5 * labelHeight;
    const labelRadius = 0.55 * diameter + labelHeight;
    const labelChildren = [];
    const corners = [];
    const lines = [];
    const arrows = [];
    let angle = -Math.PI / 2;

    const dAngle = 2 * Math.PI / dimensions.length;
    for (let dimensionIdx = 0; dimensionIdx < dimensions.length; dimensionIdx++) {
      const dimension = dimensions[dimensionIdx];
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const value = data.get(dimension);
      const scaled = Math.min(value / (maxValues[dimension] || 1), 1) * radius;
      const lineEnd = {x: center.x + lineRadius * cos, y: center.y + lineRadius * sin};
      lines.push(polygonPath([center, lineEnd], false));
      arrows.push(polygonPath(translate(rotate(arrowTip, angle), lineEnd), true));
      const labelPos = {x: Math.max(0, Math.min(diameter - labelWidth, center.x + cos * labelRadius - 0.5 * labelWidth)), y: center.y + sin * labelRadius - 0.2 * labelHeight};
      const labelText = labels ? labels[dimensionIdx] : Cache.getType(dimension).name;
      labelChildren.push(Caption({key: `label${dimension}`, x: labelPos.x, y: labelPos.y, w: labelWidth, h: labelHeight, text: labelText, style: {...labelStyle, 'h-align': 'center'}}))

      const x = center.x + scaled * cos;
      const y = center.y + scaled * sin;
      corners.push ({x,y});
      angle += dAngle;
    }

    const children = [Path_({id: 'polarContour', d: polygonPath(corners, true), fill: `url(#${fillId})`, stroke: 'rgba(0,0,0,0.2)'})._Path,
      ...arrows.map(arrow => Path_({d: arrow, fill: 'rgba(0,0,0,0.4)'})._Path),
      ...lines.map(line => Path_({d: line, style: {fill: 'none', stroke: 'rgba(0,0,0,0.4)'}})._Path)];

    return [Svg_({width: diameter, height: diameter, defs, children})._Svg, ...labelChildren];
  }

}

ComponentFactory.registerType(PolarChart);

export const PolarChart_ = (props) => ({_PolarChart: {...props, type: POLAR}});
