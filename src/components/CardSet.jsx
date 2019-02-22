import React, {Component} from 'react';
import P from 'prop-types';
import Card, {BACKGR_SHAPE} from "./Card";
import Moveable from "../arrangement/Moveable";
import GridArrangement from "../arrangement/GridArrangement";
import Tween from "../arrangement/Tween";

const PADDING = 0.2;

class CardSet extends Component {

  static propTypes = {
    nodes: P.array,
    template: P.shape({
      background: BACKGR_SHAPE,
      captions: P.array,
      textfields: P.array,
    }),
    width: P.number,
    height: P.number,
    onClick: P.func,
  };

  constructor() {
    super();
    this.arrange = this.arrange.bind(this);
    this.arrangement = new GridArrangement(PADDING);
  }

  render() {
    const {nodes, template, x, y, width, height, onClick} = this.props;

    this.elements = [];
    this.childSize = {width: template.background.w, height: template.background.h};

    console.log(`rendering cardset with ${width}/${height}`);
    const moveableNodes = [];
    new GridArrangement(PADDING).setArea(width, height).setOffset(x, y).forEachRasterpos(nodes, this.childSize, (node, rasterPos) => {
      console.log(`scale=${rasterPos.scale}`);
      moveableNodes.push(<Moveable {...this.childSize}
                                   key={node.getUniqueKey()}
                                   initialX={rasterPos.x}
                                   initialY={rasterPos.y}
                                   initialScale={rasterPos.scale}
                                   onClick={onClick}
                                   ref={(card) => {
                                     this.elements.push({node, card});
                                   }}>
        <Card {...template} graphNode={node}/>
      </Moveable>)
    });

    return (<div style={{width: "100%", position: "absolute", left: 0, top: 0, height: "100%"}}>
      {moveableNodes}
    </div>);
  };

  onResize(width, height) {
    if (this.resizeTween) {
      this.resizeTween.stop();
    }
    // this.resizeTween= new Tween(500, noEase);
    const cards = this.elements.map(element => element.card);

    new GridArrangement(PADDING).setArea(width, height).arrange(cards, this.childSize);
    // this.resizeTween.start();
  }

  arrange() {
    const tween = new Tween(600);
    const {width, height} = this.props;
    new GridArrangement(0.3).setArea(width, height).arrange(this.elements.map(element => element.card), tween, false);
    tween.start();
  }

}

export default CardSet;