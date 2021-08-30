import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory";
import {CANVAS_WIDTH, getBreadCrumbCss} from "@/Config";
import {Div_} from "@symb/Div";

const Lane = 'breadcrumb-lane';

class BreadcrumbLane extends Component {

  static type = Lane;
  // noinspection JSUnusedGlobalSymbols
  static baseTag = 'div';

  static propTypes = {
    size: P.shape({
      width: P.number.isRequired,
      height: P.number.isRequired,
      pinnedWidth: P.number.isRequired,
      onClick: P.func
    }),
  }

  constructor(props, parent, domNode) {
    super({...props, className: getBreadCrumbCss().lane}, parent, domNode);
      this.dom.onclick = props.onClick;
  }

  getScale(width) {
    return width / CANVAS_WIDTH;
  }

  createChildDescriptors(props) {
    const {size, pinnedWidth} = props;
    const {height, width} = size;
    return Div_({className: getBreadCrumbCss().pinnedBackground, size: {width: pinnedWidth, height}, spatial: {x: width - pinnedWidth, y: 0, scale: 1}})._Div;
  }

}

ComponentFactory.registerType(BreadcrumbLane);

export const BreadcrumbLane_ = (props) => ({_BreadcrumbLane: {type: Lane, ...props}});
