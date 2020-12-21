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

  // createChildrenForLod(lod) {
  //   const {nodes, arrangement, template, onClick, clickMode} = this.innerProps;
  //
  //   this.lod = lod;
  //
  //   switch (lod) {
  //     case
  //     'rect':
  //       if (this.childByKey) {
  //         Object.keys(this.childByKey).forEach(key => this.childByKey[key].destroy());
  //       }
  //       this.childByKey = {};
  //       const size = arrangement.getSize();
  //       const offset = arrangement.getOffset();
  //       this.canvas = document.createElement('canvas');
  //       this.canvas.setAttribute('width', size.width);
  //       this.canvas.setAttribute('height', size.height);
  //       setStyle(this.canvas, {position: 'absolute', left: offset.x, top: offset.y, pointerEvents: 'none'});
  //       const context = this.canvas.getContext('2d');
  //       this.dom.appendChild(this.canvas);
  //       const {width, height} = template.getSize(ARRANGEMENT_DEFAULT);
  //       arrangement.forEachRasterpos(nodes, (node, rasterPos) => {
  //         context.fillStyle = template.getCardColor(node);
  //         context.fillRect(rasterPos.x - offset.x, rasterPos.y - offset.y, rasterPos.scale * width, rasterPos.scale * height);
  //       });
  //       break;
  //     default:
  //       const childDescriptors = [];
  //       if (this.canvas) {
  //         this.canvas.remove();
  //         this.canvas = null;
  //       }
  //       arrangement.forEachRasterpos(nodes, (node, rasterPos) => {
  //         childDescriptors.push(
  //             Card_({key: node.getUniqueKey(), spatial: rasterPos, data: node, parentSet: this, onClick, template, clickMode})._Card
  //         );
  //       });
  //       this.createChildren(childDescriptors);
  //   }
  // };

  createChildDescriptors(props) {

    const { arrangement, nodes, template, onClick, clickMode } = props;

    const childDescriptors = [];
    arrangement.forEachRasterpos(nodes, (node, rasterPos) => {
      childDescriptors.push(
          Card_({key: node.getUniqueKey(), spatial: rasterPos, data: node, parentSet: this, onClick, template, clickMode})._Card
      );
    });
    return childDescriptors;
  }

}

ComponentFactory.registerType(CardSet);

export const CardSet_ = (props) => ({_CardSet: {type: CARDSET, ...props}});
