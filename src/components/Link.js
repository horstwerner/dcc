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
    templateId: P.string,
    modal: P.bool,
    onClick: P.func
  };

  constructor(descriptor, parent, domNode) {
    super(descriptor, parent, domNode);
    this.onInternalClick = this.onInternalClick.bind(this);
  }

  onInternalClick() {
    const {url, templateId, modalWidth, modalHeight} = this.innerProps;
    const openEvent = new CustomEvent(LINK_EVENT, {
      detail: {url, templateId, modalWidth, modalHeight},
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
    this.dom.setAttribute('draggable', false);
    this.dom.href = url;
    const useWhenClicked = this.parent && this.parent.hasClickHandler();
    if (modal) {
      if (useWhenClicked) {
        this.dom.whenClicked = this.onInternalClick;
        this.dom.onClick = (e) => {e.preventDefault();}
      } else {
        this.dom.onclick = this.onInternalClick;
      }
    } else if (onClick) {
      if (useWhenClicked) {
        this.dom.whenClicked = onClick;
      } else {
        this.dom.onclick = onClick;
      }
    }
  }

  createChildDescriptors(props) {
    return super.createChildDescriptors(props);
  }
}

ComponentFactory.registerType(Link);

export const Link_ = (props, children) => ({_Link: {type: LINK, children, ...props}});
