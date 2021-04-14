import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory";
import {Menu_} from "@/components/Menu";
import {getMenuPanelCss} from "@/Config";

const MENU_PANEL = 'menu-panel';

class MenuPanel extends Component {
  static type = MENU_PANEL;

  static propTypes = {
    views: P.array,
    tools: P.array,
    onViewClick: P.func,
    activeTools: P.object,
    onToolToggle: P.func
  };

  constructor(props, parent, domNode) {
    super({...props, className: getMenuPanelCss().panel}, parent, domNode);
  }


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