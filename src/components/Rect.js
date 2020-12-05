import P from 'prop-types';
import css from './Card.css';
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
    id: P.string,
    x: P.number.isRequired,
    y: P.number.isRequired,
    width: P.number.isRequired,
    height: P.number.isRequired,
    onClick: P.func
  };

  constructor(props, parent, domNode) {
    super(props, parent, domNode);
    this.handleClick = this.handleClick.bind(this);
    // only at beginning lifespan
    if (props.onClick) {
      this.dom.addEventListener('click', this.handleClick);
    }
  }

  handleClick () {
    const {id, value, onClick} = this.innerProps;
    if (onClick) {
      onClick({id, value});
    }
  };

  updateContents(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }
    this.innerProps = props;
    const { id, x, y, width, height, value} = props;
    if (DEBUG_MODE && (isNaN(width) || isNaN(height) || isNaN(x) || isNaN(y))) {
      debugger
    }
    if (id) {
      this.dom.setAttribute('id', id);
      this.dom.setAttribute('data-value', value);
      this.dom.setAttribute('title', `${id}: ${value}`);
      this.dom.setAttribute('class', css.hoverElement);
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
