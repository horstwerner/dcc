import P from 'prop-types';
import Component from "@symb/Component";
import css from "./MenuPanel.css"
import ComponentFactory from "@symb/ComponentFactory";
import {Menu_} from "@/components/Menu";

const MENU_PANEL = 'menu-panel';

class MenuPanel extends Component {
  static type = MENU_PANEL;
  static className = css.panel;

  static propTypes = {
    views: P.array,
    tools: P.array,
    onViewClick: P.func,
    activeTools: P.object,
    onToolToggle: P.func
  };

  createChildDescriptors(props) {

    const { tools, views, onViewClick, onToolToggle} = props;

    return [
      Menu_({key: "views", title: 'Views',  entries: views, onEntryClick: onViewClick})._Menu,
      (tools.length > 0 && Menu_({key: "tools", title: 'Filters',  entries: tools, onEntryClick: onToolToggle})._Menu)
    ];
  }
}

ComponentFactory.registerType(MenuPanel);
export const MenuPanel_ = (props) => ({_MenuPanel: {type: MENU_PANEL, ...props}});