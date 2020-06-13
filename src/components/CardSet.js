import P from 'prop-types';
import isEqual from 'lodash/isEqual';
import Component, {setStyle} from '@symb/Component';
import css from './CardSet.css';
import {Card_} from "./Card";
import GridArrangement from "../arrangement/GridArrangement";
import ComponentFactory from "@symb/ComponentFactory";
import GraphNode from "@/graph/GraphNode";
import Template from "@/templates/Template";
import {ARRANGEMENT_DEFAULT} from "@/templates/TemplateRegistry";

const CARDSET = 'card-set';
const PADDING = 0.2;

class CardSet extends Component {

  static type = CARDSET;
  static baseTag = 'div';
  static className = css.cardset;

  static propTypes = {
    nodes: P.arrayOf(P.instanceOf(GraphNode)),
    template: P.instanceOf(Template).isRequired,
    arrangement: P.object,
    onClick: P.func,
  };

  constructor(props, div) {
    super(props, div);
    this.arrangement = new GridArrangement(PADDING);
  }

  createChildrenForLod(lod) {
    const {nodes, arrangement, template, onClick} = this.innerProps;

    this.lod = lod;

    switch (lod) {
      case
      'rect':
        if (this.childByKey) {
          Object.keys(this.childByKey).forEach(key => this.childByKey[key].destroy());
        }
        this.childByKey = {};
        const size = arrangement.getSize();
        const offset = arrangement.getOffset();
        this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('width', size.width);
        this.canvas.setAttribute('height', size.height);
        setStyle(this.canvas, {position: 'absolute', left: offset.x, top: offset.y, pointerEvents: 'none'});
        const context = this.canvas.getContext('2d');
        this.dom.appendChild(this.canvas);
        const {width, height} = template.getSize(ARRANGEMENT_DEFAULT);
        arrangement.forEachRasterpos(nodes, (node, rasterPos) => {
          context.fillStyle = template.getCardColor(node);
          context.fillRect(rasterPos.x - offset.x, rasterPos.y - offset.y, rasterPos.scale * width, rasterPos.scale * height);
        });
        break;
      default:
        const childDescriptors = [];
        if (this.canvas) {
          this.canvas.remove();
          this.canvas = null;
        }
        arrangement.forEachRasterpos(nodes, (node, rasterPos) => {
          childDescriptors.push(
              Card_({key: node.getUniqueKey(), spatial: rasterPos, data: node, onClick, template})._Card
          );
        });
        this.createChildren(childDescriptors);
    }
  };


  updateContents(props) {

    if (isEqual(this.innerProps, props)) {
      return;
    }
    this.innerProps = props;
    const { arrangement } = props;
    const {lod} = arrangement;

    this.createChildrenForLod(lod);

  }


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

  updateArrangement(newArrangement, tween) {
    const {lod} = newArrangement;
    if (this.lod === 'rect' && lod === 'full') {
      this.createChildrenForLod(lod);
    } else if (this.lod === 'full' && lod === 'rect') {
      tween.onEndCall(()=>{this.createChildrenForLod(lod)});
    }
    const children = Object.keys(this.childByKey).map(key => this.childByKey[key]);
    newArrangement.arrange(children, tween);
  }
}

ComponentFactory.registerType(CardSet);

export const CardSet_ = (props) => ({_CardSet: {type: CARDSET, ...props}});

export default CardSet;