import P from 'prop-types';
import Component from '@symb/Component';
import css from './Card.css';
import {resolveAttribute, TYPE_CONTEXT} from "@/graph/Cache";
import ComponentFactory from "@symb/ComponentFactory";
import Template from "@/templates/Template";
import {Background, Caption, ChildSet} from "@/components/Generators";
import Chart from "@/generators/Chart";
import Trellis from "@/generators/Trellis"
import {fillIn} from "@symb/util";
import {CLICK_DISABLED, CLICK_NORMAL, CLICK_OPAQUE, CLICK_TRANSPARENT} from "@/components/Constants";

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
    const { template } = props;
    const { width, height } = template.getSize();
    this.updateSize({width, height}, tween);
  }

  /**
   * map from template to symbiosis component descriptors
   * @param {{template: Template, data: GraphNode, onClick: function}} props
   */
  createChildDescriptors(props) {

    const { data, template, onClick, hover, clickMode } = props;

    const {background, elements} = template;
    const color = template.getCardColor(data);
    const hasBackground = background.type !== 'transparent';
    const isClickable = clickMode === CLICK_OPAQUE || (clickMode === CLICK_NORMAL && template.clickable);
    const childrenClickable = clickMode === CLICK_TRANSPARENT || (clickMode === CLICK_NORMAL && !template.clickable);

    const children = [];
    if (hasBackground) {
      children.push(Background(background, color, isClickable && this.handleCardClick, hover));
    }
    elements.forEach(element => {
      const { key } = element;
      let childDescriptor = null;
      switch (element.type) {
        case 'caption':
          const {text} = element;
          const captionText = text.includes('{{') ? fillIn(text, data) : text;
          childDescriptor = Caption({...element, text: captionText});
          break;
        case 'textfield': {
          const {attribute, ...rest} = element;
          childDescriptor = Caption({
            key: attribute,
            text: String(resolveAttribute(data, attribute)),
            ...rest
          });
        }
          break;
        case 'trellis': {
          childDescriptor = Trellis( data,  element, onClick, CLICK_NORMAL);
          break;
        }
        case "chart":
          childDescriptor = Chart({key, data, descriptor: element, onClick : childrenClickable ? onClick : null });
          break;
        case "card":
          childDescriptor = ChildSet(data, data.get(TYPE_CONTEXT), element, true, childrenClickable ? onClick : null, CLICK_NORMAL);
          break;
        case "cards":
          // this.childClickAction[element.key] = element.clickAction;
          childDescriptor = ChildSet(data, data.get(TYPE_CONTEXT), element, false, childrenClickable ? onClick : null, CLICK_NORMAL);
          break;
        default:
          throw new Error(`Unsupported Element type: ${element.type}`);
      }
      if (childDescriptor) {
        if (!childrenClickable) {
          childDescriptor.style = {...(childDescriptor.style || {}), pointerEvents: 'none'};
        } else {
          childDescriptor.style = {...(childDescriptor.style || {}), pointerEvents: ''};
        }
      }
      children.push(childDescriptor);
    });

    return children;
  };

  // morph(arrangementName, tween, onClick) {
  //   const { template, data } = this.innerProps;
  //   const stateDescriptor = template.arrangements[arrangementName];
  //   if (!stateDescriptor) {
  //     throw new Error(`Template ${template.type} has no state ${arrangementName}`);
  //   }
  //   const { elements } = template;
  //   const { layout } = stateDescriptor;
  //   const color = template.colorCoder ? template.colorCoder.getColor(data): null;
  //
  //   // update background with new onClick method, but make sure not to change spatial position
  //   const spatial = this.childByKey[KEY_BACKGROUND].getSpatial();
  //   this.updateChild(KEY_BACKGROUND,
  //       Background({...template.background, spatial}, color, onClick));
  //   Object.keys(layout).forEach(key => {
  //     const element = this.childByKey[key];
  //     const elementState = layout[key];
  //     const position = template.getChildProps(key, arrangementName);
  //     if (element.constructor === CardSet) {
  //       const childTemplate = TemplateRegistry.getTemplate(find(elements, {key}).template);
  //       const childSize = childTemplate.getSize();
  //       const setArrangement = createArrangement(elementState.arrangement, childSize);
  //       element.updateArrangement(setArrangement, tween);
  //     } else {
  //       const {x, y, w, h, alpha, arrangement, clickAction} = elementState;
  //       const native = element.getNativeSize(arrangement);
  //       if (x!= null && y != null && w!= null && h != null) {
  //         const spatial = fit(w, h, native.width, native.height, x, y);
  //         tween.addTransform(element, spatial.x, spatial.y, spatial.scale);
  //       }
  //       if (alpha != null) {
  //         tween.addFade(element, alpha);
  //       }
  //       if (element.constructor === Card) {
  //         element.morph(elementState.arrangement, tween,
  //             clickAction ? () => {this.handleChildClick(key, clickAction)} : null);
  //         if (elementState.clickAction) {
  //           this.childClickAction[element.key] = elementState.clickAction;
  //         }
  //       }
  //     }
  //   });
  // }

  // getNativeSize() {
  //   const { template } = this.innerProps;
  //   return template.getSize();
  // }

}

ComponentFactory.registerType(Card);

export const Card_ = (props) => ({_Card: {type: CARD, ...props}});

