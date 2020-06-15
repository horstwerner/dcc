import P from 'prop-types';
import isEqual from 'lodash/isEqual';
import Component from '@symb/Component';
import ComponentFactory from '@symb/ComponentFactory';
import css from './NavigationMap.css';
import TemplateRegistry from '../templates/TemplateRegistry';
import {CardSet_} from "./CardSet";
import {Image_} from "@symb/Image";
import {ELEMENT_GROUP, transitionPropTypes} from "../Map";
import {Card_} from "@/components/Card";
import {fit} from "@symb/util";
import Tween from "@/arrangement/Tween";
import Card from "@/components/Card";

const NAVIGATIONMAP = 'navigationmap';
const BACKGROUND = 'background';
const ACTION_REARRANGE = 'rearrange';

const elementShape = {
  type: P.oneOf(['group', 'card', 'label', 'donut', 'bar']),
  onClick: P.shape(transitionPropTypes)
};

const createElement = function (descriptor, dataSource, onClick) {
  switch (descriptor.type) {
    case ELEMENT_GROUP: {
      const {key, title, source, x, y, width, height} = descriptor;
      const template = TemplateRegistry.getTemplate(descriptor.template);
      const spatial = fit(width, height, template.background.w, template.background.h, x, y);
      const nodes = dataSource.getAllNodesOf(source);
      // const cardSetProps = {key,, width, height, backdrop, template, nodes;
      return Card_({key, spatial, data: {elements: nodes, title}, onClick, template})._Card
    }
    default:
      throw new Error(`Unknown element type ${descriptor.type}`);
  }
};

class NavigationMap extends Component {

  static type = NAVIGATIONMAP;
  // noinspection JSUnusedGlobalSymbols
  static baseTag = 'div';
  static className = css.map;

  static propTypes = {
    dataSource: P.shape({
      getAllNodesOf: P.func.isRequired
    }),
    width: P.number.isRequired,
    height: P.number.isRequired,
    elements: P.arrayOf(P.shape(elementShape)),
    onElementClick: P.func.isRequired
  };

  constructor(props, domNode) {
    super(props, domNode);
    this.handleElementClick = this.handleElementClick.bind(this);
    this.state = {  }
  }

  handleElementClick(key, action) {
    // if (action.type === ACTION_REARRANGE) {
    //   const tween = new Tween(600);
    //   const { elements } = action;
    //   Object.keys(this.childByKey).forEach(key => {
    //     if (!elements[key]) {
    //       tween.addFade(this.childByKey[key],0.1);
    //     } else {
    //       const element = this.childByKey[key];
    //       if (element.constructor !== Card) {
    //         throw new Error(`can't reposition navigation map element ${key}, only cards allowed`);
    //       }
    //       const {x, y, width, height, morph} = elements[key];
    //       if (morph) {
    //          element.morph(morph, tween);
    //       } else {
    //         const template = element.getTemplate();
    //         const spatial = fit(width, height, template.background.w, template.background.h, x, y);
    //         tween.addTransform(element, spatial.x, spatial.y, spatial.scale);
    //       }
    //     }
    //   });
    //   tween.start();

    // } else {
      const { onElementClick } = this.innerProps;
      onElementClick(this.childByKey[key], action);
    // }
  }

  updateContents(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }
    this.innerProps = props;
    const {dataSource, width, height, elements, backdrop} = props;

    const childDescriptors = [];
    if (backdrop) {
      childDescriptors.push(Image_({key: BACKGROUND, className: css.background, source: backdrop, width, height})._Image);
    }
    elements.forEach(descriptor =>
        childDescriptors.push(
            createElement(descriptor, dataSource,
                descriptor.onClick ? () => this.handleElementClick(descriptor.key, descriptor.onClick) : null))
    );
    this.updateStyle({width, height});
    this.createChildren(childDescriptors);
  }
}

ComponentFactory.registerType(NavigationMap);

export const NavigationMap_ = (props) => ({_NavigationMap: {type: NAVIGATIONMAP, ...props}});
