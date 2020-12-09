import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from '@ssymb/ComponentFactory';
import css from './Button.css';

export const BUTTON = 'button';

export default class Button extends Component {

  static propTypes = {
    text: P.string,
    onClick: P.func
  };

  updateContents(props) {
    this.innerProps = {...props};

    const {text, onClick} = props;
    this.createChild(Div_({className: css.button, onclick: onClick}, text)._Div)
  }

}

ComponentFactory.registerType(BUTTON, Button);

export const Button_ = (props) => ({_Button: {type: BUTTON, ...props}});
