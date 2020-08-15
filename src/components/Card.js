import P from 'prop-types';
import Component from '@symb/Component';
import css from './Card.css';
import {resolveAttribute, TYPE_CONTEXT} from "@/graph/Cache";
import isEqual from "lodash/isEqual";
import ComponentFactory from "@symb/ComponentFactory";
import Template from "@/templates/Template";
import {Background, Caption, ChildSet} from "@/components/Generators";
import Chart from "@/generators/Chart";
import Trellis from "@/generators/Trellis"
import {fillIn} from "@symb/util";

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
    onClick: P.func
  };

  constructor(descriptor, domNode) {
    super(descriptor, domNode);
    this.childClickAction = {};
  }

  handleChildClick(childKey, clickAction) {
    // const tween = new Tween(DURATION_REARRANGEMENT);
    // this.morph(clickAction, tween);
    // tween.start();
  }

  /**
   * map from template to symb component descriptors
   * @param {{template: Template, data: GraphNode, onClick: function}} props
   */
  updateContents(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }
    this.innerProps = props;

    const { data, template, onClick } = props;

    const {background, elements} = template;
    const color = template.getCardColor(data);

    const children = [Background(background, color)];
    elements.forEach(element => {
      const { key } = element;
      switch (element.type) {
        case 'caption':
          const {text} = element;
          const captionText = text.includes('{{') ? fillIn(text, data) : text;
          children.push(Caption({...element, text: captionText}));
          break;
        case 'textfield': {
          const {attribute, ...rest} = element;
          children.push(Caption({
            key: attribute,
            text: String(resolveAttribute(data, attribute)),
            ...rest
          }));
          }
          break;
        case 'trellis': {
          children.push(Trellis( data,  element, onClick));
          break;
        }
        case "chart":
          children.push(Chart({key, data, descriptor: element, onClick }));
          break;
        case "card":
          children.push(ChildSet(data, data.get(TYPE_CONTEXT), element, true, onClick));
          break
        case "cards":
          // this.childClickAction[element.key] = element.clickAction;
          children.push(ChildSet(data, data.get(TYPE_CONTEXT), element, false, onClick));
          break;
        default:
          throw new Error(`Unsupported Element type: ${element.type}`);
      }
    });

    this.createChildren(children);
    //TODO: remove dependency to 'root' literal
    this.updateStyle({...this.style, width: background.w, height: background.h});
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

  getNativeSize() {
    const { template } = this.innerProps;
    return template.getSize();
  }

}

ComponentFactory.registerType(Card);

export const Card_ = (props) => ({_Card: {type: CARD, ...props}});

