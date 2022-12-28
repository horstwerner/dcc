import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory"
import css from "./Link.css";
import {LINK_EVENT} from "@/components/Link";

const CLICKABLE = 'clickable';

export class Link extends Component {
  static type = CLICKABLE;
  static baseTag = 'DIV'
  static className = css.link;
  static propTypes = {
    text: P.string,
    templateId: P.string,
    onClick: P.func
  };

  constructor(descriptor, parent, domNode) {
    super(descriptor, parent, domNode);
    this.onInternalClick = this.onInternalClick.bind(this);
  }

  onInternalClick() {
    const {templateId, modalWidth, modalHeight} = this.innerProps;
    const openEvent = new CustomEvent(LINK_EVENT, {
      detail: {templateId, modalWidth, modalHeight},
      bubbles: true,
      cancelable: true,
      composed: false
    });
    this.dom.dispatchEvent(openEvent);
    return false;
  }

  updateDom(props) {
    const { text } = props;
    if (text) {
      this.dom.innerText = text;
    }
    this.dom.target = "_blank";
    this.dom.setAttribute('draggable', 'false');
    const useWhenClicked = this.parent && this.parent.hasClickHandler();
    if (useWhenClicked) {
      this.dom.whenClicked = this.onInternalClick;
      this.dom.onClick = (e) => {e.preventDefault();}
    } else {
      this.dom.onclick = this.onInternalClick;
    }
}

  createChildDescriptors(props) {
    return super.createChildDescriptors(props);
  }
}

ComponentFactory.registerType(Link);

export const Clickable_ = (props, children) => ({_Clickable: {type: CLICKABLE, children, ...props}});
