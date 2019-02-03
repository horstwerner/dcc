import React, {Component} from 'react';
import P from 'prop-types';
import Card, {BACKGR_SHAPE} from "./Card";
import {Moveable} from "../arrangement/Moveable";
import GridArrangement from "../arrangement/GridArrangement";
import Tween from "../arrangement/Tween";

class CardSet extends Component {

  static propTypes = {
    nodes: P.array,
    template: P.shape({
      background: BACKGR_SHAPE,
      captions: P.array,
      textfields: P.array,
    }),
    width: P.number,
    height: P.number
  };

  constructor() {
    super();
    this.arranged = false;
    this.arrange = this.arrange.bind(this);
  }

  render() {
    const {nodes, template} = this.props;

    const start = performance.now();
    this.elements = [];
    let end = 0;

    if (!this.arranged) {
      setTimeout(this.arrange, 2);
    }

    return (<div style={{width: "100%", position: "relative", height: "100%", backgroundColor: "#c0e040"}}>
      {nodes.map(node => {
        return (
            <Moveable width={template.background.h} height={template.background.h} key={node.getUniqueKey()}
                      ref={(card) => {
                        this.elements.push({node, card});
                        end++;
                        if (end === 1000) {
                          end = performance.now();
                          console.log(`1000 took ${end - start} ms`);
                        }
                      }}>
              <Card {...template} graphNode={node}/>
            </Moveable>
        );
      })}
    </div>);

  };

  arrange() {
    const tween = new Tween(600);
    const {width, height} = this.props;
    new GridArrangement(0.3).setArea(width, height).arrange(this.elements.map(element => element.card), tween, false);
    tween.start();
  }

}

export default CardSet;