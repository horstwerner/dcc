import React from 'react';
import P from 'prop-types';
import Card, {BACKGR_SHAPE} from "./Card";

const CardSet = function CardSet(props) {
  const {nodes, template} = props;
  let cursor = 20;
  let lastWidth = 0;
  return (<div style={{width: "100%", position: "relative", height: "100%", backgroundColor: "#c0e040"}}>
    {nodes.map(node => {
      cursor += 1.2 * lastWidth;
      console.log(`cursor is ${cursor}`);
      lastWidth = template.background.w;
      return (<Card key={node.id} {...template} x={cursor} y={50} graphNode={node}/>);
    })}
  </div>)
};

CardSet.propTypes = {
  nodes: P.array,
  template: P.shape({
    background: BACKGR_SHAPE,
    captions: P.array,
    textfields: P.array,
  })
};

export default CardSet;