import P from 'prop-types';
import css from './Sidebar.css';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory";
import {MARGIN, MENU_WIDTH} from "@/Config";
import {MenuPanel_} from "@/components/MenuPanel";
import {Div_} from "@symb/Div";
import {Image_} from "@symb/Image";

const SIDEBAR = 'sidebar';

class Sidebar extends Component {

  static type = SIDEBAR;
  static className = css.sideBar;

  static propTypes = {
    w: P.number.isRequired,
    h: P.number.isRequired,
    menuTop: P.number.isRequired,
    // selectedCard: P.shape({template: P.instanceOf(Template), data: P.instanceOf(GraphNode)})
    views: P.array,
    tools: P.array,
    onViewClick: P.func,
    onToolToggle: P.func,
  };

  updateDom(props) {
    const { w, h } = props;
    if (!w || !h) return;
    this.updateStyle({width: w, height: h});
  }

  createChildDescriptors(props) {

    const { menuTop, views, tools, onViewClick, onToolToggle } = props;

    return[
      Div_({className: css.searchField, spatial: {x: 20, y: MARGIN, scale: 1}, children: Image_({className:css.searchButton, source:`public/SearchButton.svg`})._Image})._Div,
      MenuPanel_({
        w: MENU_WIDTH,
        h: 400,
        views,
        tools,
        onViewClick,
        onToolToggle,
        spatial: {x: 0, y: menuTop, scale: 1}
      })._MenuPanel
    ];
  }

}

ComponentFactory.registerType(Sidebar);
export const Sidebar_ = (props) => ({_Sidebar: {type: SIDEBAR, ...props}});
