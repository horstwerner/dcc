import React, {Component} from 'react';
import P from 'prop-types';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import Moveable from '../arrangement/Moveable';
import Tween from "../arrangement/Tween";
import css from './Group.module.css';


export default class Group extends Component {

  constructor(props){
    super(props);
    this.elementsByKey={};
    this.registerMoveable = this.registerMoveable.bind(this);
  }

  registerMoveable(key, element) {
    this.elementsByKey[key].moveable = element;
    const pendingTransition = get(this.pendingTransitions, 'key');
    if (pendingTransition) {
      delete this.pendingTransitions[key];
      this.addTransitionToPendingTween(pendingTransition)
    }
    if (this.pendingTween && isEmpty(this.pendingTransitions)) {
      this.startPendingTween();
      this.pendingTween = null;
    }
  }

  render() {

    const {elements, arrangement, tween} = this.props;
    const positions = arrangement.getPositions(elements);

    const elementNodes = [];
    const renderedElementsByKey = {};
    elements.forEach(element => {
      const {key, x, y, scale, alpha, node} = element;
      if (isNaN(x) || isNaN(y) || isNaN(scale)) {
        throw new Error(`Invalid actor position x:${x} y:${y} scale:${scale}`);
      }
      const existing = this.elementsByKey[key];
      if (existing) {
        elementNodes.push(existing.node);
        renderedElementsByKey[key] = existing;
        if (tween) {
          tween.addTransform(existing.moveable)
        }
      } else {
        const actorNode = (<Moveable
            key={`moveable-${key}`}
            ref={(element) => this.registerMoveable(key, element)}
            initialX={x} initialY={y} initialScale={scale} initialAlpha={alpha === undefined ? 1 : alpha}>
          {node}
        </Moveable>);

        renderedElementsByKey[key] = {node: actorNode};
        elementNodes.push(actorNode);
      }
    });

    if (transitions) {
      // if there already is a pending tween, it is discarded because outdated
      this.pendingTween = new Tween(600);
      this.pendingTransitions = {};
      let pendingActors = false;
      transitions.forEach(transition => {
        if (existingMoveable) {
          this.addTransitionToPendingTween(transition, existingMoveable);
        } else {
          this.pendingTransitions.push(transition);
          pendingActors = true;
        }
      });
      if (!pendingActors) {
        this.startPendingTween();
      }
    }

    this.elementsByKey = renderedElementsByKey;
    return <div className={css.Stage} onClick={this.createSnapshot} ref={element => this.domNode = element}>
      {/*{backdrop && <img alt='background' src={backdrop}/>}*/}
      {elementNodes}
    </div>
  }
}