import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory"
import css from "./Link.css";

const LINK = 'link';

export class Link extends Component {
  static type = LINK;
  static baseTag = 'A'
  static className = css.link;
  static propTypes = {
    text: P.string,
    url: P.string
  };

  updateDom(props) {
    const { text, url } = props;
    if (text) {
      this.dom.innerText = text;
    }
    this.dom.target = "_blank";
    this.dom.href = url;
  }

  createChildDescriptors(props) {
    return super.createChildDescriptors(props);
  }
}

ComponentFactory.registerType(Link);

export const Link_ = (props, children) => ({_Link: {type: LINK, children, ...props}});
