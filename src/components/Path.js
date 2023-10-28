import P from 'prop-types';
import ComponentFactory from '@symb/ComponentFactory';
import Component from "@symb/Component";

const SVGNS = "http://www.w3.org/2000/svg";
const PATH = 'svg_path';

class Path extends Component {

  static baseTag = 'path';
  static type = PATH;

  static propTypes = {
    id: P.string,
    d: P.string.isRequired,
    fill: P.string,
    stroke: P.string,
    strokeWidth: P.string
  };

  updateDom(props, tween) {

    const { id, d, fill, stroke, strokeWidth } = props;

    if (id) {
      this.dom.setAttribute('id', id);
    }
    if (fill) {
      this.dom.setAttribute('fill', fill);
    }
    if (stroke) {
      this.dom.setAttribute('stroke', stroke);
    }
    if (strokeWidth) {
      this.dom.setAttribute('stroke-width', strokeWidth);
    }
    this.dom.setAttribute('d', d);
  }

  createChildDescriptors(props) {
    return null;
  }

}


ComponentFactory.registerType( Path );

export const Path_ = (props) => ({_Path: {type: PATH, nameSpace: SVGNS, ...props}});
