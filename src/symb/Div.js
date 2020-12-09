import P from 'prop-types';
import {cloneDeep, isEqual, merge} from 'lodash';
import Component from "./Component";
import ComponentFactory from "./ComponentFactory"

const DIV = 'div';

export class Div extends Component {
  static type = DIV;
  static propTypes = {
      ...Component.propTypes,
      onClick: P.func
  };

  updateContents(props) {
    this.innerProps = {...props};

    const { onClick, children } = props;
    if (children) {
      this.createChildren(children);
    }
    if (onClick) {
      this.dom.onclick = onClick;
    }
  }
}

ComponentFactory.registerType(Div);

// Syntactical sugar makes for better readability

export const Div_ = (props, children) => ({_Div: {type: DIV, children, ...props}});

export const FlexBox_ = (props, children) => ({_FlexBox: {type: DIV, children, ...merge(props, {style: {display: 'flex'}})}});