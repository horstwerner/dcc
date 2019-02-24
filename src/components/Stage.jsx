import React, {Component} from 'react';
import P from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import css from './Stage.module.css'
import Tween from "../arrangement/Tween";

const actorProps = Actor.propertyTypes;

const transitionProps = {
  key: P.string,
  targetX: P.number,
  targetY: P.number,
  targetWidth: P.number,
  targetHeight: P.number,
  targetAlpha: P.number,
};

export default class Stage extends Component {

  static propTypes = {
    stageWidth: P.number,
    stageHeight: P.number,
    actors: P.arrayOf(P.shape(actorProps)),
    transitions: P.arrayOf(P.shape(transitionProps))
  };

  constructor() {
    super();
    this.state = {
      incoming: null,
      outgoing: null,
      present: null
    };
    this.actorsByKey = {};
    this.registerMoveable = this.registerMoveable.bind(this);
    this.createSnapshot = this.createSnapshot.bind(this);
  }

  startPendingTween() {
    if (this.currentTween) {
      this.currentTween.stop();
    }
    this.pendingTween.onEndCall((tween) => {
      if (this.currentTween === tween) {
        this.currentTween = null;
      }
    });
    this.currentTween = this.pendingTween;
    this.pendingTween.start();
  }

  addTransitionToPendingTween(transition, moveable) {
    if (transition.x !== undefined && transition.y !== undefined && transition.scale !== undefined) {
      this.pendingTween.addTransform(moveable, transition.x, transition.y, transition.scale);
    }
    if (transition.alpha != null) {
      this.pendingTween.addFade(moveable, transition.alpha);
    }
  }

  registerMoveable(key, element) {
    this.actorsByKey[key].moveable = element;
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

    const {stageWidth, stageHeight, backdrop, actors, transitions} = this.props;

    const actorNodes = [];
    const renderedActorsByKey = {};
    actors.forEach(actor => {
      const {key, x, y, scale, alpha, node} = actor;
      if (isNaN(x) || isNaN(y) || isNaN(scale)) {
        throw new Error(`Invalid actor position x:${x} y:${y} scale:${scale}`);
      }
      const existing = this.actorsByKey[key];
      if (existing) {
        actorNodes.push(existing.node);
        renderedActorsByKey[key] = existing;
      } else {
        const actorNode = (<Moveable
            key={`moveable-${key}`}
            ref={(element) => this.registerMoveable(key, element)}
            initialX={x} initialY={y} initialScale={scale} initialAlpha={alpha === undefined ? 1 : alpha}>
          {node}
        </Moveable>);

        renderedActorsByKey[key] = {node: actorNode};
        actorNodes.push(actorNode);
      }
    });

    if (transitions) {
      // if there already is a pending tween, it is discarded because outdated
      this.pendingTween = new Tween(600);
      this.pendingTransitions = {};
      let pendingActors = false;
      transitions.forEach(transition => {
        const existingMoveable = this.actorsByKey[transition.key].moveable;
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

    this.actorsByKey = renderedActorsByKey;
    return <div className={css.Stage} onClick={this.createSnapshot} ref={element => this.domNode = element} style={{width: stageWidth, height: stageHeight}}>
      {backdrop && <img alt='background' src={backdrop}/>}
      {actorNodes}
    </div>
  }

  createSnapshot() {
    const {stageWidth, stageHeight} = this.props;
    // Data URI template to create SVG images
    const svg = `data:image/svg+xml,
        <svg xmlns='http://www.w3.org/2000/svg' width='${300}' height='${200}'>
    <foreignObject width='800' height='400'>
      <div xmlns="http://www.w3.org/1999/xhtml">
        <ul>
          <li><strong>First</strong> item</li>
 
          <li><em>Second</em> item</li>
          <li>Thrid item</li>
        </ul>
      </div>    </foreignObject>
            </svg>`;


    // console.log(this.domNode.innerHTML);

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    const img = new Image();
    const ctx = canvas.getContext("2d");
    const self = this;

    img.onload = () => {
      console.log("SVG drawImage()");
      console.log(img.naturalWidth);
      console.log(img.naturalHeight);
      ctx.drawImage(img, 0, 0, 800, 400);
      while (self.domNode.firstChild) {
        self.domNode.removeChild(this.domNode.firstChild);
      }
      self.domNode.appendChild(canvas);
    };
    img.src = svg;

    ctx.font = "bold 12px sans-serif";
    ctx.fillStyle = "#000000";
    ctx.fillText("Foobar", 10, 10);
  }

}
