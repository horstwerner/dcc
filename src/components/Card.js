import P from 'prop-types';
import Component from '@symb/Component';
import css from './Card.css';
import {resolveAttribute} from "../graph/Cache";
import {Div_} from "@symb/Div";
import isEqual from "lodash/isEqual";
import ComponentFactory from "@symb/ComponentFactory";
import {Image_} from "@symb/Image";
import GridArrangement, {GRID} from "@/arrangement/GridArrangement";
import {CardSet_} from "@/components/CardSet";
import TemplateRegistry from '../templates/TemplateRegistry';

const CARD = 'card';
const PADDING = 0.2;

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
const BACKGR_IMAGE = 'image';
export const BACKGR_SHAPE = P.shape({type: P.oneOf([BACKGR_RECT]), color: P.string});

function Background(props, onClick) {
  const {type, color, w, h, source, cornerRadius} = props;
  const className =  onClick ? css.clickable : css.background;
  switch (type) {
    case BACKGR_RECT:
      return Div_({key: 'background', className,
        style:{backgroundColor: color, width: w, height: h, borderRadius: cornerRadius}})._Div;
    case BACKGR_IMAGE:
      return Image_({key: 'background', className, source, width: w, height: h, cornerRadius, onClick})._Image;
    default:
      throw new Error(`Unknown background type: ${type}`);
  }
}

function Caption(props) {
  const {key, x, y, w, h, text, color} = props;
  return Div_({key, className: css.caption, style:{width: w, height: h, left: x, top: y, color: color, fontSize: h}}, text)._Div
}

function createArrangement(descriptor, childTemplate) {
  const childSize = {width: childTemplate.background.w, height: childTemplate.background.h};

  const { type } = descriptor;
  // console.log(`rendering cardset with ${width}/${height}`);
  switch (type) {
    case GRID:
      const {x, y, width, height } = descriptor;
      return new GridArrangement(PADDING, childSize)
          .setArea(width, height)
          .setOffset(x, y)
  }
}

function childSetDescriptor(data, set, onClick) {
  const {source, arrangement} = set;
  const templateName = set.template;
  const template = TemplateRegistry.getTemplate(templateName);

  let nodes = resolveAttribute(data, source);
  if (!Array.isArray(nodes)) {
    nodes = [nodes];
  }
  if (!nodes) return null;
  return CardSet_({nodes,
    template,
    arrangement: createArrangement(arrangement, template),
    onClick})._CardSet
}

Caption.propTypes = CAPTION_PROPS;

export const SHAPE_TEMPLATE = P.shape({
      background: BACKGR_SHAPE,
      captions: P.array,
      textfields: P.array});

export default class Card extends Component {

  static type = CARD;
  static baseTag = 'div';
  static className = css.card;

  static propTypes = {
    template: SHAPE_TEMPLATE,
    data: P.object
  };

  getTemplate() {
    return this.innerProps.template;
  }

  updateContents(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }
    this.innerProps = props;

    const {template, data, onClick} = props;
    const {background, captions, textfields, childcards} = template;

    const hasCaptions = captions && captions.length > 0;
    const hasTextFields = textfields && textfields.length > 0;
    const hasChildCards = childcards && childcards.length > 0;

    const children = [Background(background, onClick ?  () => onClick(this) : null)];
    if (hasCaptions) {
      captions.forEach(caption => children.push(Caption({key: caption.text, ...caption})));
    }
    if (hasTextFields) {
      textfields.forEach(textfield => {
        const {attribute, ...rest} = textfield;
        children.push(Caption({
              key: attribute,
              text: resolveAttribute(data, textfield.attribute),
              ...rest
            })
        );
      });
    }
    if (hasChildCards) {
      childcards.forEach(set => {
        children.push(childSetDescriptor(data, set))
      });
    }
    this.createChildren(children);
    this.updateStyle({...this.style, width: background.w, height: background.h, pointerEvents: onClick ? '': 'none'});
  };
}

ComponentFactory.registerType(Card);

export const Card_ = (props) => ({_Card: {type: CARD, ...props}});

