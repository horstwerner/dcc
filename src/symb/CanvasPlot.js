import P from 'prop-types';
import Component from '@symb/Component';

export default class CanvasPlot extends Component {

  static baseTag = 'canvas';
  static propTypes = {width: P.number, height: P.number};

  constructor(props, domNode) {
    super (props, domNode);

    const { width, height } = props;

    this.dom.setAttribute('width', width);
    this.dom.setAttribute('height', height);
    this.context = this.dom.getContext('2d');
  }

  renderRect(x, y, width, height, color) {
    this.context.fillStyle = color;
    this.context.fillRect(x, y, width, height);
  }

}