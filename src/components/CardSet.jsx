import React from 'react';
import P from 'prop-types';
import { BACKGR_SHAPE } from "./Card";
import Card from "./Card";

const CardSet = function CardSet(props) {
  const {nodes, template} = props;

  return (<div style={{display:"flex"}}>
    {nodes.map(node => <Card key={node.id} {...template} graphNode={node} />)}
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