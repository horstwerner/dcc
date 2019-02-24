import P from 'prop-types';
import isEqual from 'lodash/isEqual';
import Component from '@symb/Component';
import ComponentFactory from '@symb/ComponentFactory';
import css from './NavigationMap.css';
import TemplateRegistry from '../templates/TemplateRegistry';
import {CardSet_} from "./CardSet";
import {Image_} from "@symb/Image";
import {ELEMENT_GRID, transitionPropTypes} from "../Map";

const NAVIGATIONMAP = 'navigationmap';

const elementShape = {
  type: P.oneOf(['grid', 'card', 'label', 'donut', 'bar']),
  onClick: P.shape(transitionPropTypes)
};

const createElement = function (descriptor, dataSource, onClick) {
  switch (descriptor.type) {
    case ELEMENT_GRID:
      const {key, source, x, y, width, height} = descriptor;
      const nodes = dataSource.getAllNodesOf(source);
      const template = TemplateRegistry.getTemplate(source);
      const cardSetProps = {key, spatial:{x, y, scale: 1}, width, height, template, nodes};

      return CardSet_({key:descriptor.type, ...cardSetProps, onClick})._CardSet;
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

  updateContents(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }
    this.innerProps = props;
    const {dataSource, width, height, elements, backdrop, onElementClick} = props;

    const childDescriptors = [];
    if (backdrop) {
      childDescriptors.push(Image_({key: 'background', className: css.background, source: backdrop, width, height})._Image);
    }
    elements.forEach(descriptor =>
        childDescriptors.push(
            createElement(descriptor, dataSource, ()=>{onElementClick(descriptor.key, descriptor.onClick)}))
    );
    this.updateStyle({width, height});
    this.createChildren(childDescriptors);
  }
}

ComponentFactory.registerType(NavigationMap);

export const NavigationMap_ = (props) => ({_NavigationMap: {type: NAVIGATIONMAP, ...props}});
