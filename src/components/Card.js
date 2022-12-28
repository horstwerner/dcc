import P from 'prop-types';
import Component from '@symb/Component';
import css from './Card.css';
import ComponentFactory from "@symb/ComponentFactory";
import Template from "@/templates/Template";
import {Background} from "@/components/Generators";
import {CLICK_DISABLED, CLICK_NORMAL, CLICK_OPAQUE, CLICK_TRANSPARENT} from "@/components/Constants";
import {overlay} from "@symb/ColorUtil";

const CARD = 'card';

class Card extends Component {

  static type = CARD;
  // noinspection JSUnusedGlobalSymbols
  static baseTag = 'div';
  static className = css.card;

  // noinspection JSUnusedGlobalSymbols
  static propTypes = {
    template: P.instanceOf(Template),
    data: P.object.isRequired,
    options: P.objectOf({"id": P.string, "value": P.any}),
    onClick: P.func,
    clickMode: P.oneOf([CLICK_NORMAL, CLICK_OPAQUE, CLICK_TRANSPARENT, CLICK_DISABLED])
  };

  constructor(descriptor, parent, domNode) {
    super(descriptor, parent, domNode);
    this.handleCardClick = this.handleCardClick.bind(this);
  }

  handleCardClick(e) {
    if (this.innerProps.onClick) {
      this.innerProps.onClick({event: e, component: this});
    }
  }

  updateDom(props, tween) {
    const { template, hover, clickMode, onClick, onMouseEnter, onMouseLeave } = props;
    const { width, height } = template.getSize();
    this.updateSize({width, height}, tween);

    const isClickable = onClick && (clickMode === CLICK_OPAQUE || (clickMode === CLICK_NORMAL && template.isClickable()));

    this.dom.className =  hover ? css.hovering : (isClickable && onClick ? css.clickable : css.background);
    if (isClickable) {
      if (this.parent && this.parent.hasClickHandler()) {
        this.dom.whenClicked = this.handleCardClick;
      } else {
        this.dom.onclick = this.handleCardClick;
        this.dom.oncontextmenu = this.handleCardClick;
      }
    } else if (this.dom.onclick) {
      this.dom.onclick = null;
      this.dom.oncontextmenu = null;
    }

    if (onMouseEnter) {
      this.dom.onmouseenter = onMouseEnter;
    } else if (this.dom.onmouseenter) {
      this.dom.onmouseenter = null;
    }
    if (onMouseLeave) {
      this.dom.onmouseleave = onMouseLeave;
    } else if (this.dom.onmouseleave) {
      this.dom.onmouseleave = null;
    }

    const { background } = template.descriptor;

    if (background && background.type !== 'transparent') {
      const { cornerRadius } = background;
      this.dom.style.borderRadius = `${cornerRadius}px`;
      this.dom.style.overflow = 'hidden';
    }

  }

  /**
   * map from template to symbiosis component descriptors
   * @param {{template: Template, data: GraphNode, onClick: function}} props
   */
  createChildDescriptors(props) {

    const { data, template, onClick, clickMode, options, highlightCondition, deEmphasizeColor } = props;

    const { background } = template.descriptor;
    const templateColor = template.getCardColor(data);
    const color = deEmphasizeColor ?  overlay(templateColor, deEmphasizeColor, true) : templateColor;
    const hasBackground = background.type !== 'transparent';
    const childrenClickable = clickMode === CLICK_TRANSPARENT || (clickMode === CLICK_NORMAL && !template.isClickable());

    const children = [];
    if (hasBackground) {
      children.push(Background(background, color));
    }
    template.getElementsForOptions(options).forEach(element => {
      let childDescriptor = template.createElementInstance(element, data, highlightCondition, childrenClickable ? onClick : null);
      if (childDescriptor) {
        if (!childrenClickable) {
          childDescriptor.style = {...(childDescriptor.style || {}), pointerEvents: 'none'};
        } else {
          childDescriptor.style = {...(childDescriptor.style || {}), pointerEvents: ''};
        }
        if (deEmphasizeColor) {
          childDescriptor.alpha = 0.4;
        } else {
          childDescriptor.alpha = 1;
        }
        children.push(childDescriptor);
      }
    });

    return children;
  };
}

ComponentFactory.registerType(Card);

export const Card_ = (props) => ({_Card: {type: CARD, ...props}});

