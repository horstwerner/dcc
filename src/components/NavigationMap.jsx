import React, {Component} from 'react';
import P from 'prop-types';
import css from './NavigationMap.module.css';
import TemplateRegistry from '../templates/TemplateRegistry';
import CardSet from "./CardSet";
import {ELEMENT_GRID, transitionPropTypes} from "../Map";

const elementShape = {
  type: P.oneOf(['grid', 'card', 'label', 'donut', 'bar']),
  onClick: P.shape(transitionPropTypes)
};

const createElement = function (descriptor, dataSource, onClick) {
  switch (descriptor.type) {
    case ELEMENT_GRID:
      const {source, x, y, width, height} = descriptor;
      const nodes = dataSource.getAllNodesOf(source);
      const template = TemplateRegistry.getTemplate(source);
      const cardSetProps = {x, y, width, height, template, nodes};
      return (<CardSet key={descriptor.type} {...cardSetProps} onClick={onClick}/>);
    default:
      throw new Error(`Unknown element type ${descriptor.type}`);
  }
};

export default class NavigationMap extends Component {

  static propTypes = {
    dataSource: P.shape({
      getAllNodesOf: P.func.isRequired
    }),
    width: P.number.isRequired,
    height: P.number.isRequired,
    elements: P.arrayOf(P.shape(elementShape)),
    onElementClick: P.func.isRequired
  };

  render() {
    const {dataSource, width, height, elements, background, onElementClick} = this.props;

    return (<div className={css.map} style={{width, height}}>
      {elements.map(descriptor => createElement(descriptor, dataSource, ()=>{onElementClick(descriptor.key, descriptor.onClick)}))}
    </div>);

  }

}