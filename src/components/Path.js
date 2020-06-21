import P from 'prop-types';
import ComponentFactory from '@symb/ComponentFactory';
import Component from "@symb/Component";
import isEqual from "lodash/isEqual";

const SVGNS = "http://www.w3.org/2000/svg";
const PATH = 'svg_path';

export default class Path extends Component {

  static baseTag = 'path';
  static type = PATH;

  static propTypes = {
    id: P.string,
    d: P.string.isRequired
  };

  updateContents(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }
    this.innerProps = props;
    const { id, d } = props;

    if (id) {
      this.dom.setAttribute('id', id);
    }
    this.dom.setAttribute('d', d);
  }
}

ComponentFactory.registerType( Path );

export const Path_ = (props) => ({_Path: {type: PATH, nameSpace: SVGNS, ...props}});
