import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory";
import {getMenuPanelCss} from "@/Config";
import grayMenuPanelCss from "@/components/themes/gray/MenuPanel.css";

const MENU_PANEL = 'menu-panel';

export const calcPanelHeight = (options) => 25 * options.length + 36 + 16;

class MenuPanel extends Component {
  static type = MENU_PANEL;

  static propTypes = {
    color: P.string
  };

  constructor(props, parent, domNode) {
    super({...props, className: props.color === 'gray' ? grayMenuPanelCss.panel : getMenuPanelCss().panel}, parent,
        domNode);
  }
}

ComponentFactory.registerType(MenuPanel);
export const MenuPanel_ = (props) => ({_MenuPanel: {type: MENU_PANEL, ...props}});