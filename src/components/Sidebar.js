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
import {Div_} from "@symb/Div";
import {Image_} from "@symb/Image";

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
    tools: P.array,
    onViewClick: P.func,
    onToolToggle: P.func,
  };

  updateContents(props) {
    if (isEqual(props, this.innerProps)) return;
    this.innerProps = {...props};

    const { w, h, menuTop, views, tools, onViewClick, onToolToggle } = props;
    if (!w || !h) return;

    this.dom.style.width = `${w}px`;
    this.dom.style.height = `${h}px`;

    this.createChildren([
      Div_({className: css.searchField, spatial: {x: 20, y: MARGIN, scale: 1}, children: Image_({className:css.searchButton, source:`public/SearchButton.svg`})._Image})._Div,
      MenuPanel_({
        w: MENU_WIDTH,
        h: 0.5 * h,
        views,
        tools,
        onViewClick,
        onToolToggle,
        spatial: {x: (w - MENU_WIDTH) / 2, y: 80, scale: 1}
      })._MenuPanel
    ]);

  }

}

ComponentFactory.registerType(Sidebar);
export const Sidebar_ = (props) => ({_Sidebar: {type: SIDEBAR, ...props}});
