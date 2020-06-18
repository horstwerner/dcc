import P from 'prop-types';
import ComponentFactory from '@symb/ComponentFactory';
import Component from "@symb/Component";
import isEqual from "lodash/isEqual";
import {DEBUG_MODE} from "@/Config";

const SVGNS = "http://www.w3.org/2000/svg";
const RECT = 'svg_rect';

export default class Rect extends Component {

  static baseTag = 'rect';
  static type = RECT;

  static propTypes = {
    x: P.number.isRequired,
    y: P.number.isRequired,
    width: P.number.isRequired,
    height: P.number.isRequired,
  };

  updateContents(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }
    this.innerProps = props;
    const { x, y, width, height} = props;
    if (DEBUG_MODE && (isNaN(width) || isNaN(height) || isNaN(x) || isNaN(y))) {
      debugger
    }
    this.dom.setAttribute('shape-rendering','crispEdges');
    this.dom.setAttribute('width', width);
    this.dom.setAttribute('height', height);
    this.dom.setAttribute('x', x);
    this.dom.setAttribute('y', y);

  }

}

ComponentFactory.registerType( Rect);

export const Rect_ = (props) => ({_Rect: {type: RECT, nameSpace: SVGNS, ...props}});
