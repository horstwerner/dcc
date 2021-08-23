import Component from "@symb/Component";
import css from "./LoadingAnimation.css";
import {Span_} from "@symb/Span";
import ComponentFactory from "@symb/ComponentFactory";
import {Div_} from "@symb/Div";

const LOADING_ANIMATION = 'loadingAnimation';

export default class LoadingAnimation extends Component {

  static className = css.outerFrame;
  static type = LOADING_ANIMATION;

  createChildDescriptors(props) {
    return [
        Div_({style: {width: 200, textAlign: 'center'}}, 'Data is being loaded'),
        Div_({className: css.loadingBars},[
      Span_({})._Span,
      Span_({})._Span,
      Span_({})._Span,
      Span_({})._Span,
      Span_({})._Span
        ])._Div
    ]
  }
}

ComponentFactory.registerType(LoadingAnimation);

export const LoadingAnimation_ = (props, children) => ({_LoadingAnimation: {type: LOADING_ANIMATION, children, ...props}});
