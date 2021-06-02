import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory";
import {CANVAS_WIDTH, getBreadCrumbCss} from "@/Config";
import Tween from "@/arrangement/Tween";

const Lane = 'breadcrumb-lane';

class BreadcrumbLane extends Component {

  static type = Lane;
  // noinspection JSUnusedGlobalSymbols
  static baseTag = 'div';

  static propTypes = {
    size: P.shape({width: P.number.isRequired, height: P.number.isRequired, onScroll: P.func.isRequired, onClick: P.func}),
  }

  constructor(props, parent, domNode) {
    super({...props, className: getBreadCrumbCss().lane}, parent, domNode);
    this.dom.onscroll = props.onScroll;
    this.dom.onclick = props.onClick;
  }

  getScale(width) {
    return width / CANVAS_WIDTH;
  }

  createChildDescriptors(props) {
    return null;
  }


  getScrollPos() {
    return this.dom.scrollLeft;
  }

  scrollToPos(newScrollLeft, tween) {

    const useTween = tween || new Tween(600);

    useTween
        .addInterpolation({left: this.dom.scrollLeft}, {left: newScrollLeft}, ({left}) => {this.dom.scrollLeft = left});
    if (!tween) {
      useTween.start();
    }
  }
}

ComponentFactory.registerType(BreadcrumbLane);

export const BreadcrumbLane_ = (props) => ({_BreadcrumbLane: {type: Lane, ...props}});
