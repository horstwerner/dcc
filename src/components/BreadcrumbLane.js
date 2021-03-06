import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory";
import css from "@/components/BreadcrumbLane.css";
import {Div_} from "@symb/Div";
import {CANVAS_WIDTH} from "@/Config";
import Tween from "@/arrangement/Tween";

const Lane = 'breadcrumb-lane';

class BreadcrumbLane extends Component {

  static type = Lane;
  // noinspection JSUnusedGlobalSymbols
  static baseTag = 'div';
  static className = css.lane;

  static propTypes = {
    size: P.shape({width: P.number.isRequired, height: P.number.isRequired, onScroll: P.func.isRequired}),
  }

  constructor(props, parent, domNode) {
    super(props, parent, domNode);
    this.dom.onscroll = props.onScroll;
  }

  getScale(width) {
    return width / CANVAS_WIDTH;
  }

  createChildDescriptors(props) {

    const { children, canvasWidth } = props;
    const canvas =  Div_(
        { key:'workbook-canvas',
          className: css.canvas,
          style: {width: canvasWidth, height: 1}}
    )._Div

    return [canvas, ...children];
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
