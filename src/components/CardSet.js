import P from 'prop-types';
import isEqual from 'lodash/isEqual';
import Component, {setStyle} from '@symb/Component';
import css from './CardSet.css';
import {Card_} from "./Card";
import ComponentFactory from "@symb/ComponentFactory";
import GraphNode from "@/graph/GraphNode";
import Template from "@/templates/Template";
import {ARRANGEMENT_DEFAULT} from "@/templates/TemplateRegistry";
import Arrangement from "@/arrangement/Arrangement";
import {CLICK_DISABLED, CLICK_NORMAL, CLICK_OPAQUE, CLICK_TRANSPARENT} from "@/components/Constants";

const CARDSET = 'card-set';
const PADDING = 0.2;

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

  createChildrenForLod(lod) {
    const {nodes, arrangement, template, onClick, clickMode} = this.innerProps;

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
              Card_({key: node.getUniqueKey(), spatial: rasterPos, data: node, parentSet: this, onClick, template, clickMode})._Card
          );
        });
        this.createChildren(childDescriptors);
    }
  };

  updateContents(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }
    this.innerProps = {...props};

    const { arrangement } = props;
    const { lod } = arrangement;

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
    const { lod } = newArrangement;
    if (this.lod === LOD_RECT && lod === LOD_FULL) {
      this.createChildrenForLod(lod);
    } else if (this.lod === LOD_FULL && lod === LOD_RECT) {
      tween.onEndCall(()=>{this.createChildrenForLod(lod)});
    }
    const children = Object.keys(this.childByKey).map(key => this.childByKey[key]);
    newArrangement.arrange(children, tween);
  }
}

ComponentFactory.registerType(CardSet);

export const CardSet_ = (props) => ({_CardSet: {type: CARDSET, ...props}});

export default CardSet;