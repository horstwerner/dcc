import Component from "@symb/Component";
import ComponentFactory from "./ComponentFactory"

const SPAN = 'span';

export class Span extends Component {
  static type = SPAN;
  static baseTag = 'span';
  static propTypes = {
    ...Component.propTypes,
  };
}

ComponentFactory.registerType(Span);

export const Span_ = (props, children) => ({_Span: {type: SPAN, children, ...props}});
