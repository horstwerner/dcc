import P from 'prop-types';
import Component from "./Component";
import ComponentFactory from "./ComponentFactory"

const DIV = 'div';

export class Div extends Component {
  static type = DIV;
}

ComponentFactory.registerType(Div);

// Syntactical sugar makes for better readability

export const Div_ = (props, children) => ({_Div: {type: DIV, children, ...props}});

