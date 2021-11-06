import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory"
import css from "./Link.css";

const LINK = 'link';
export const LINK_EVENT = 'linkEvent';

export class Link extends Component {
  static type = LINK;
  static baseTag = 'A'
  static className = css.link;
  static propTypes = {
    text: P.string,
    url: P.string,
    modal: P.bool,
    onClick: P.func
  };

  constructor(props) {
    super(props);
    this.onInternalClick = this.onInternalClick.bind(this);
  }

  onInternalClick() {
    const {url, modalWidth, modalHeight} = this.innerProps;
    const openEvent = new CustomEvent(LINK_EVENT, {
      detail: {url, modalWidth, modalHeight},
      bubbles: true,
      cancelable: true,
      composed: false,
    });
    this.dom.dispatchEvent(openEvent);
    return false;
  }

  updateDom(props) {
    const { text, url, modal, onClick } = props;
    if (text) {
      this.dom.innerText = text;
    }
    this.dom.target = "_blank";
    this.dom.href = url;
    if (modal) {
      this.dom.onclick = this.onInternalClick;
    } else if (onClick) {
      this.dom.onclick = onClick;
    }
  }

  createChildDescriptors(props) {
    return super.createChildDescriptors(props);
  }
}

ComponentFactory.registerType(Link);

export const Link_ = (props, children) => ({_Link: {type: LINK, children, ...props}});
