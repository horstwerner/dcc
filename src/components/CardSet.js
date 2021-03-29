import P from 'prop-types';
import Component from '@symb/Component';
import css from './CardSet.css';
import {Card_} from "./Card";
import ComponentFactory from "@symb/ComponentFactory";
import GraphNode from "@/graph/GraphNode";
import Template from "@/templates/Template";
import Arrangement from "@/arrangement/Arrangement";
import {CLICK_DISABLED, CLICK_NORMAL, CLICK_OPAQUE, CLICK_TRANSPARENT} from "@/components/Constants";

const CARDSET = 'card-set';

export const LOD_RECT = 'rect';
export const LOD_FULL = 'full';

class CardSet extends Component {

  static type = CARDSET;
  static baseTag = 'div';
  static className = css.cardset;

  static propTypes = {
    nodes: P.arrayOf(P.instanceOf(GraphNode)),
    template: P.instanceOf(Template).isRequired,
    arrangement: P.instanceOf(Arrangement),
    onClick: P.func,
    clickMode: P.oneOf([CLICK_NORMAL, CLICK_OPAQUE, CLICK_TRANSPARENT, CLICK_DISABLED])
  };

  constructor(props, parent, div) {
    super(props, parent, div);
  }

  createChildDescriptors(props) {

    const { arrangement, nodes, template, onClick, clickMode, options } = props;

    const childDescriptors = [];
    arrangement.forEachRasterpos(nodes, (node, rasterPos) => {
      childDescriptors.push(
          Card_({key: node.getUniqueKey(), spatial: rasterPos, data: node, parentSet: this, onClick, template, clickMode, options})._Card
      );
    });
    return childDescriptors;
  }
}

ComponentFactory.registerType(CardSet);

export const CardSet_ = (props) => ({_CardSet: {type: CARDSET, ...props}});
