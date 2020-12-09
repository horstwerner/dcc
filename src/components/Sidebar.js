import P from 'prop-types';
import {isEqual} from 'lodash';
import css from './Sidebar.css';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory";
import Template from "@/templates/Template";
import GraphNode from "@/graph/GraphNode";
import {Card_} from "@/components/Card";
import {fit} from "@symb/util";
import {MARGIN, MENU_WIDTH} from "@/Config";
import {MenuPanel_} from "@/components/MenuPanel";

const SIDEBAR = 'sidebar';

const SELECTED_TOP = 100;

class Sidebar extends Component {

  static type = SIDEBAR;
  static className = css.sideBar;

  static propTypes = {
    w: P.number.isRequired,
    h: P.number.isRequired,
    // selectedCard: P.shape({template: P.instanceOf(Template), data: P.instanceOf(GraphNode)})
    views: P.array,
    tools: P.array
  };

  updateContents(props) {
    if (isEqual(props, this.innerProps)) return;
    this.innerProps = {...props};

    const { w, h, menuTop, views, tools } = props;
    if (!w || !h) return;

    this.dom.style.width = `${w}px`;
    this.dom.style.height = `${h}px`;

    const netW = w - 2 * MARGIN;
    const children = [
        MenuPanel_({
          w: MENU_WIDTH,
          h: 0.5 * h,
          spatial: {x: 0, y: menuTop, scale: 1}
        })._MenuPanel
    ];

    // if (selectedCard) {
    //   const size = selectedCard.template.getSize();
    //   const spatial = fit(netW, h, size.width, size.height, MARGIN / 2, SELECTED_TOP, 1);
    //   spatial.y = SELECTED_TOP;
    //   children.push( Card_({...selectedCard, key: 'selected', spatial})._Card);
    // }

    this.createChildren(children);

  }

}

ComponentFactory.registerType(Sidebar);
export const Sidebar_ = (props) => ({_Sidebar: {type: SIDEBAR, ...props}});
