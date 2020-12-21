import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from '@symb/ComponentFactory';
import css from './Button.css';
import {Div_} from "@symb/Div";

export const BUTTON = 'button';

class Button extends Component {

  static propTypes = {
    text: P.string,
    onClick: P.func
  };

  createChildDescriptors(props) {
    const {text, onClick} = props;
    return Div_({className: css.button, onclick: onClick}, text)._Div;
  }

}

ComponentFactory.registerType(BUTTON, Button);

export const Button_ = (props) => ({_Button: {type: BUTTON, ...props}});
