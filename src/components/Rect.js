import P from 'prop-types';
import ComponentFactory from '@symb/ComponentFactory';
import Component from "@symb/Component";
import isEqual from "lodash/isEqual";

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
    fill: P.string,
    stroke: P.string,
    strokeWidth: P.number
  };

  updateContents(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }
    this.innerProps = props;
    const { width, height} = props;
    this.dom.setAttribute('width', width);
    this.dom.setAttribute('height', height);

  }

}

ComponentFactory.registerType( Rect);

export const Rect_ = (props) => ({_Rect: {type: RECT, nameSpace: SVGNS, ...props}});
