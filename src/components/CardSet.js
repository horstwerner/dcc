import P from 'prop-types';
import isEqual from 'lodash/isEqual';
import Component from '@symb/Component';
import css from './CardSet.css';
import {Card_, BACKGR_SHAPE} from "./Card";
import GridArrangement from "../arrangement/GridArrangement";
import Tween from "../arrangement/Tween";
import ComponentFactory from "@symb/ComponentFactory";
import GraphNode from "@/graph/GraphNode";

const CARDSET = 'card-set';
const PADDING = 0.2;

class CardSet extends Component {

  static type = CARDSET;
  static baseTag = 'div';
  static className = css.cardset;

  static propTypes = {
    nodes: P.arrayOf(P.instanceOf(GraphNode)),
    template: P.shape({
      background: BACKGR_SHAPE,
      captions: P.array,
      textfields: P.array,
    }),
    width: P.number,
    height: P.number,
    onClick: P.func,
  };

  constructor(props, div) {
    super(props, div  );
    this.arrange = this.arrange.bind(this);
    this.arrangement = new GridArrangement(PADDING);
  }

  updateContents(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }
    this.innerProps = props;
    const {nodes, template, x, y, width, height, onClick} = props;

    if (isNaN(width) || isNaN(height)) {
      throw new Error('non-number passed as width or height');
    }

    this.elements = [];
    this.childSize = {width: template.background.w, height: template.background.h};

    console.log(`rendering cardset with ${width}/${height}`);
    const childDescriptors = [];

    new GridArrangement(PADDING, this.childSize)
        .setArea(width, height)
        .setOffset(x, y)
        .forEachRasterpos(nodes, (node, rasterPos) => {
          childDescriptors.push(
              Card_({key: node.getUniqueKey(), spatial: rasterPos, graphNode: node, onClick, template})._Card
          );
    });

    this.createChildren(childDescriptors);
  };

  onResize(width, height) {
    if (this.resizeTween) {
      this.resizeTween.stop();
    }
    // this.resizeTween= new Tween(500, noEase);
    const cards = this.elements.map(element => element.card);

    new GridArrangement(PADDING).setArea(width, height).arrange(cards);
    // this.resizeTween.start();
  }

  arrange() {
    const tween = new Tween(600);
    const {width, height} = this.props;
    new GridArrangement(PADDING, this.childSize)
        .setArea(width, height)
        .arrange(this.elements.map(element => element.card), tween, false);
    tween.start();
  }
}

ComponentFactory.registerType(CardSet);

export const CardSet_ = (props) => ({_CardSet: {type: CARDSET, ...props}});

export default CardSet;