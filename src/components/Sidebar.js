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
    size: P.shape({width: P.number.isRequired, height: P.number.isRequired}),
    menuTop: P.number.isRequired,
    // selectedCard: P.shape({template: P.instanceOf(Template), data: P.instanceOf(GraphNode)})
    views: P.array,
    tools: P.array,
    onViewClick: P.func,
    onToolToggle: P.func,
  };

  createChildDescriptors(props) {

    const { menuTop, views, tools, onViewClick, onToolToggle } = props;

    return[
      Div_({className: css.searchField, spatial: {x: 20, y: MARGIN, scale: 1}, children: Image_({className:css.searchButton, source:`public/SearchButton.svg`})._Image})._Div,
      MenuPanel_({
        size: { width:  MENU_WIDTH, height: 400 },
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
