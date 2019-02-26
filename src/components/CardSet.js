import P from 'prop-types';
import isEqual from 'lodash/isEqual';
import Component from '@symb/Component';
import css from './CardSet.css';
import {Card_, BACKGR_SHAPE, SHAPE_TEMPLATE} from "./Card";
import GridArrangement from "../arrangement/GridArrangement";
import Tween from "../arrangement/Tween";
import ComponentFactory from "@symb/ComponentFactory";
import GraphNode from "@/graph/GraphNode";
import {Image_} from "@symb/Image";

const CARDSET = 'card-set';
const PADDING = 0.2;

class CardSet extends Component {

  static type = CARDSET;
  static baseTag = 'div';
  static className = css.cardset;

  static propTypes = {
    nodes: P.arrayOf(P.instanceOf(GraphNode)),
    template: SHAPE_TEMPLATE.isRequired,
    arrangement: P.object,
    onClick: P.func,
  };

  constructor(props, div) {
    super(props, div  );
    this.arrangement = new GridArrangement(PADDING);
  }

  updateContents(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }
    this.innerProps = props;
    const {nodes, arrangement, template, onClick} = props;

    this.elements = [];

    const childDescriptors = [];

    arrangement.forEachRasterpos(nodes, (node, rasterPos) => {
          childDescriptors.push(
              Card_({key: node.getUniqueKey(), spatial: rasterPos, data: node, onClick, template})._Card
          );
    });

    this.createChildren(childDescriptors);
  };

  // onResize(width, height) {
  //   if (this.resizeTween) {
  //     this.resizeTween.stop();
  //   }
  //   // this.resizeTween= new Tween(500, noEase);
  //   const cards = this.elements.map(element => element.card);
  //
  //   new GridArrangement(PADDING).setArea(width, height).arrange(cards);
  //   // this.resizeTween.start();
  // }

  updateArrangement(arrangement, tween) {
    this.innerProps.arrangement = arrangement;
    const children = Object.keys(this.childByKey).map(key => this.childByKey[key]);
    arrangement.arrange(children, tween);
  }
}

ComponentFactory.registerType(CardSet);

export const CardSet_ = (props) => ({_CardSet: {type: CARDSET, ...props}});

export default CardSet;