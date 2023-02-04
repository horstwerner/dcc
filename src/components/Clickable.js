import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory"
import css from "./Link.css";
import {LINK_EVENT} from "@/components/Link";

const INTERNAL_LINK = 'internalLink';

export class InternalLink extends Component {
  static type = INTERNAL_LINK;
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
    this.setClickable(true, this.onInternalClick);
  }

  createChildDescriptors(props) {
    return super.createChildDescriptors(props);
  }
}

ComponentFactory.registerType(InternalLink);

export const InternalLink_ = (props, children) => ({_Clickable: {type: INTERNAL_LINK, children, ...props}});
