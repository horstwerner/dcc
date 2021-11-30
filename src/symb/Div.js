import P from 'prop-types';
import merge from 'lodash/merge';
import Component from "./Component";
import ComponentFactory from "./ComponentFactory"

const DIV = 'div';

export class Div extends Component {
  static type = DIV;
  static propTypes = {
      ...Component.propTypes,
      onClick: P.func
  };

  updateDom(props) {
    const { onClick, contentEditable, onFocus, onBlur, onKeyDown, onKeyUp, tabIndex, onMouseEnter, onMouseLeave, title } = props;
    if (onClick) {
      this.dom.onclick = onClick;
      this.dom.oncontextmenu = onClick;
    }
    if (contentEditable) {
      this.dom.contentEditable = contentEditable;
    }
    if (onFocus) {
      this.dom.onfocus = onFocus;
    }
    if (onBlur) {
      this.dom.onblur = onBlur
    }
    if (onKeyUp) {
      this.dom.onkeyup = onKeyUp;
    }
    if (onKeyDown) {
      this.dom.onkeydown = onKeyDown;
    }
    if (tabIndex) {
      this.dom.tabIndex = tabIndex;
    }
    if (onMouseEnter) {
      this.dom.onmouseenter = onMouseEnter;
    }
    if (onMouseLeave) {
      this.dom.onmouseleave = onMouseLeave;
    }
    if (title) {
      this.dom.title = title;
    }
  }
}

ComponentFactory.registerType(Div);

// Syntactical sugar makes for better readability

export const Div_ = (props, children) => ({_Div: {type: DIV, children, ...props}});

export const FlexBox_ = (props, children) => ({_FlexBox: {type: DIV, children, ...merge(props, {style: {display: 'flex'}})}});