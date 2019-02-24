import P from 'prop-types';
import flatten from 'lodash/flatten';
import Component from '@symb/Component';
import css from './Card.css';
import GraphNode from "../graph/GraphNode";
import {resolveAttribute} from "../graph/Cache";
import {Div_} from "@symb/Div";
import isEqual from "lodash/isEqual";
import ComponentFactory from "@symb/ComponentFactory";

const CARD = 'card';

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
      return Div_({key: 'background', className: css.background, style:{backgroundColor: color, width: w, height: h}})._Div;
    default:
      throw new Error(`Unknown background type: ${type}`);
  }
}

function Caption(props) {
  const {key, x, y, w, h, text, color} = props;
  return Div_({key, className: css.caption, style:{width: w, height: h, left: x, top: y, color: color, fontSize: h}}, text)._Div
}

Caption.propTypes = CAPTION_PROPS;

export default class Card extends Component {

  static type = CARD;
  static baseTag = 'div';
  static className = css.card;

  static propTypes = {
    template: P.shape({
      background: BACKGR_SHAPE,
      captions: P.array,
      textfields: P.array}),
    graphNode: P.instanceOf(GraphNode)
  };

  updateContents(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }
    this.innerProps = props;

    const {template, graphNode} = props;
    const {background, captions, textfields} = template;

    const hasCaptions = captions && captions.length > 0;
    const hasTextFields = textfields && textfields.length > 0;

    const children = [Background(background)];
    if (hasCaptions) {
      captions.forEach(caption => children.push(Caption({key: caption.text, ...caption})));
    }
    if (hasTextFields) {
      textfields.forEach(textfield => {
        const {attribute, ...rest} = textfield;
        children.push(Caption({
              key: attribute,
              text: resolveAttribute(graphNode, textfield.attribute),
              ...rest
            })
        );
      });
    }
    this.createChildren(children);
    this.updateStyle({...this.style, width: background.w, height: background.h});
  };
}

ComponentFactory.registerType(Card);

export const Card_ = (props) => ({_Card: {type: CARD, ...props}});

