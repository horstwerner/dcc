import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory";
import css from "@/components/BreadcrumbLane.css";
import isEqual from "lodash/isEqual";
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
    width: P.number.isRequired,
    height: P.number.isRequired,
    activeCardKey: P.string
  }

  // constructor(descriptor, domNode) {
  //   super(descriptor, domNode);
  //   this.childClickAction = {};
  //   this.handleCardClick = this.handleCardClick.bind(this);
  // }

  getScale(width) {
    return width / CANVAS_WIDTH;
  }

  updateContents(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }
    if (!this.innerProps || props.width !== this.innerProps.width || props.height !== this.innerProps.height) {
      this.updateStyle({width: props.width, height: props.height});
    }
    this.innerProps = {...props};

    const { children, height, canvasWidth } = props;
    const canvas =  Div_(
        { key:'workbook-canvas',
          className: css.canvas,
          style: {width: 10000, height: 1},
          children}
    )._Div

    this.createChildren([canvas, ...children]);
  }

  getScrollPos() {
    return this.dom.scrollTop;
  }

  scrollToPos(newScrollTop, tween) {

    const useTween = tween || new Tween(600);

    useTween
        .addInterpolation([this.dom.scrollTop], [newScrollTop], (values) => {this.dom.scrollTop = values[0]});

    if (!tween) {
      useTween.start();
    }
  }
}

ComponentFactory.registerType(BreadcrumbLane);

export const BreadcrumbLane_ = (props) => ({_BreadcrumbLane: {type: Lane, ...props}});
