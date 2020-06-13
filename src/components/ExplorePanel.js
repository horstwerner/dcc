import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory";
import GraphNode from "@/graph/GraphNode";
import {ViewSwitch_} from "@/components/ViewSwitch";
import {CardSet_} from "@/components/CardSet";
import Template from "@/templates/Template";
import GridArrangement from "@/arrangement/GridArrangement";
import {sliceBy} from "@/graph/Grouping";
import {Div_} from "@symb/Div";
import Arrangement from "@/arrangement/Arrangement";

const EXPLOREPANEL = 'explorepanel';

const VIEWSWITCH_W = 250;
const TOPBAR_H = 32;

const calcGrid = function calcGrid(width, height, childCount, idealChildAspectRatio, labelH, labelW) {

  const childArea = (width * height) / childCount - labelH * labelW;
  const maxChildH = Math.sqrt(childArea /  idealChildAspectRatio);
  const maxChildW = maxChildH * idealChildAspectRatio;

  const unitH = maxChildH + labelH;
  const unitW = Math.max(maxChildW, maxLabelW);
  const idealUnitAspectRatio = unitW / unitH;

  const effectivear = this.areaw / this.areah / idealUnitAspectRatio;

  //calculate number of rows and columns, then distances in Grid
  let rows = Math.min(childcount, Math.max(Math.round(Math.sqrt(childCount / effectivear)), 1));
  if (rows < childCount && (childcount - rows) / childCount < 0.2) {
    rows = childCount;
  }
  const cols = Math.ceil(childCount / rows);
  const childW = Math.floor(width / cols);
  const childH = Math.floor(height / rows);

  return { rows, cols, childW, childH }
};

export default class ExplorePanel extends Component {

  static type = EXPLOREPANEL;

  static propTypes = {
    nodes: P.arrayOf(P.instanceOf(GraphNode)),
    template: P.instanceOf(Template),
    views: P.arrayOf(string),
    groupBy: P.string,
    filters: P.arrayOf(Filter),
    view: P.string
  };

  arrangement;

  constructor(props, domNode) {
    super(props, domNode);
    const { template } = props;
    this.arrangement = new GridArrangement(0.1, template.getSize());
  }

  subGroups({nodes, groupBy, template, }) {
    const slices = sliceBy(nodes, groupBy);
    const groupCount = slices.getNumOfSlices();
    const { width, height } = this.spatial;
    const result = [];

    const labelH = 16;
    const labelW = 160;

    const { cols, childW, childH } = calcGrid(width - VIEWSWITCH_W, height, groupCount, template.getAspectRatio(), labelH, labelW);
    let idx = 0;
    const labelStyle = {width: childW, height: 16, fontSize: 12, fontWeight: bold };
    const childSetArrangement = new Arrangement(0.1, template.getSize()).setArea(childW, childH - labelH);
    slices.forEachEntry((key, nodes) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = col * childW + VIEWSWITCH_W;
      const y = row * childH + TOPBAR_H;
      result.push(Div_({spatial: {x, y }, style: labelStyle},key)._Div);
      result.push(CardSet_({spatial: {x, y: y + labelH }, nodes, template, arrangement: childSetArrangement, onClick: null})._CardSet);
    });

    return result;
  }

  updateContents(innerprops) {
    this.innerprops = innerprops;
    const { views, nodes, template } = this.innerprops;
    const { width, height} = this.style;

    const contents = this.groupBy ?
        this.subGroups({nodes, groupBy: this.groupBy, template}) :
        [CardSet_({spatial: {x: VIEWSWITCH_W, y: TOPBAR_H, scale: 1}, nodes, template, onClick: null})._CardSet];

    this.createChildren([
        ViewSwitch_({ views, width: VIEWSWITCH_W, height })._ViewSwitch,
        ...contents
        ]
    );
  }
}

ComponentFactory.registerType(ExplorePanel);

export const ExplorePanel_ = (props) => ({_ExplorePanel: {type: EXPLOREPANEL, ...props}});
