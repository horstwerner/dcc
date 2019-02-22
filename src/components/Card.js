import P from 'prop-types';
import {omit} from 'lodash';
import Component from '@ssymb/Component';
import css from './Card.css';
import GraphNode from "../graph/GraphNode";
import {resolveAttribute} from "../graph/Cache";
import {Div_} from "@symb/Div";

const POSITION_PROPS = {
  x: P.number.isRequired,
  y: P.number.isRequired,
  w: P.number.isRequired,
  h: P.number.isRequired,
};

export const CAPTION_PROPS = {
    ...POSITION_PROPS,
  color: P.string,
  text: P.string
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
      return Div_({className: css.background, style:{backgroundColor: color, width: w, height: h}})._Div;
    default:
      throw new Error(`Unknown background type: ${type}`);
  }
}

function Caption(props) {
  const {x, y, w, h, text, color} = props;
  return Div_({className: css.caption, style:{width: w, height: h, left: x, top: y, color: color, fontSize: h}}, text)._Div
}

Caption.propTypes = CAPTION_PROPS;

export default class Card extends Component{

  static baseTag = 'div';
  static className = 'css.card';
  static propTypes = {
    background: BACKGR_SHAPE,
    captions: P.array,
    textfields: P.array,
    graphNode: P.instanceOf(GraphNode)
  };

  update(props) {
  const {background, captions, textfields, graphNode} = props;

  const hasCaptions = captions && captions.length > 0;
  const hasTextFields = textfields && textfields.length > 0;

  const children = [
      Background(background),
      hasCaptions && captions.map(caption => Caption({key:caption.text,...caption})),
      hasTextFields && textfields.map(textfield =>
          Caption({key: textfield.attribute, ...omit(textfield, ['attribute']),
            text: resolveAttribute(graphNode, textfield.attribute)}))
  ].filter(Boolean);

  super.update({...props, style: {width: background.width, height: background.height}, children});

};

