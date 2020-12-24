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
    size: P.shape({width: P.number.isRequired, height: P.number.isRequired}),
  }

  // constructor(descriptor, domNode) {
  //   super(descriptor, domNode);
  //   this.childClickAction = {};
  //   this.handleCardClick = this.handleCardClick.bind(this);
  // }

  getScale(width) {
    return width / CANVAS_WIDTH;
  }

  createChildDescriptors(props) {

    const { children } = props;
    const canvas =  Div_(
        { key:'workbook-canvas',
          className: css.canvas,
          style: {width: 10000, height: 1}}
    )._Div

    return [canvas, ...children];
  }


  getScrollPos() {
    return this.dom.scrollTop;
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
