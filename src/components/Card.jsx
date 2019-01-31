import React from 'react';
import P from 'prop-types';
import {omit} from 'lodash';
import css from './Card.module.css';
import GraphNode from "../graph/GraphNode";
import {resolveAttribute} from "../graph/Cache";

const POSITION_PROPS = {
  x: P.number.isRequired,
  y: P.number.isRequired,
  w: P.number.isRequired,
  h: P.number.isRequired,
};

export const CAPTION_PROPS = {
    ...POSITION_PROPS,
  color: P.string,
    text: P.string.isRequired
};

export const TEXT_PROPS = {
  ...POSITION_PROPS,
  color: P.string,
  attribute: P.string.isRequired
};

const BACKGR_RECT = 'rect';
export const BACKGR_SHAPE = P.shape({type: P.oneOf([BACKGR_RECT]), color: P.string});

function Background(props) {
  const {type, color, w, h} = props;
  switch (type) {
    case BACKGR_RECT:
      return (<div className={css.background} style={{backgroundColor: color, width: w, height: h}}/>);
    default:
      throw new Error(`Unknown background type: ${type}`);
  }
}

Background.propTypes = {
  type: P.string,
  color: P.string,
  w: P.number,
  h: P.number
};

function Caption(props) {
  const {x, y, w, h, text, color} = props;
  return (<div className={css.caption}
               style={{width: w, height: h, left: x, top: y, color: color, fontSize: h}}>{text}</div>);
}

Caption.propTypes = CAPTION_PROPS;

const Card = function Card(props) {
  const {x, y, background, captions, textfields, graphNode} = props;

  const hasCaptions = captions && captions.length > 0;
  const hasTextFields = textfields && textfields.length > 0;

  return <div className={css.card} style={{left: x, top: y, width: background.width, height: background.height}}>
    <Background {...background}/>
      {hasCaptions && captions.map(caption => <Caption key={caption.text}{...caption}/>)}
      {hasTextFields && textfields.map(textfield => <Caption key={textfield.attribute}{...omit(textfield, ['attribute'])} text={resolveAttribute(graphNode, textfield.attribute)} />)}
  </div>
};

Card.propTypes = {
  x: P.number,
  y: P.number,
  background: BACKGR_SHAPE,
  captions: P.array,
  textfields: P.array,
  graphNode: P.instanceOf(GraphNode)
};

export default Card;