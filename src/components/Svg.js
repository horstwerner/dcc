import P from 'prop-types';
import ComponentFactory from '@symb/ComponentFactory';
import Component from "@symb/Component";
import isEqual from "lodash/isEqual";

const SVGNS = "http://www.w3.org/2000/svg";
const SVG = 'svg';

export default class Svg extends Component {

  static baseTag = 'svg';
  static type = SVG;

  static propTypes = {
    width: P.number.isRequired,
    height: P.number.isRequired
  };

  updateContents(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }
    this.innerProps = props;
    const {children, width, height} = props;
    this.dom.setAttribute('width', width);
    this.dom.setAttribute('height', height);

    this.createChildren(children);
  }

}

ComponentFactory.registerType(Svg);

export const Svg_ = (props) => ({_Svg: {type: SVG, nameSpace: SVGNS, ...props}});
