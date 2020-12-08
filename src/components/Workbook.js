import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory";
import css from "@/components/Workbook.css";
import isEqual from "lodash/isEqual";
import {Div_} from "@symb/Div";
import {CANVAS_WIDTH} from "@/Config";
import Tween from "@/arrangement/Tween";

const WORKBOOK = 'workbook';

class Workbook extends Component {

  static type = WORKBOOK;
  // noinspection JSUnusedGlobalSymbols
  static baseTag = 'div';
  static className = css.workbook;

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
    this.innerProps = props;
    const { children, width, canvasHeight } = props;
    const scale = this.getScale(width);
    const canvas =  Div_({ key:'workbook-canvas', className: css.canvas, style: {width: CANVAS_WIDTH, height: canvasHeight},
      spatial: {x: 0, y: 0, scale},
      children}
      )._Div

    this.createChildren(canvas);
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

ComponentFactory.registerType(Workbook);

export const Workbook_ = (props) => ({_Workbook: {type: WORKBOOK, ...props}});
