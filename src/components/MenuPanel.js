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
    onToolToggle: P.func,
    w: P.number.isRequired,
    h: P.number.isRequired,
  };

  updateDom(props) {
    const {w, h} = props;

    this.dom.style.width = `${w}px`;
    this.dom.style.height = `${h}px`;
  };

  createChildDescriptors(props) {

    const {w, tools, views, onViewClick, onToolToggle} = props;

    return [
      Menu_({key: "views", title: 'Views', w, entries: views, onEntryClick: onViewClick})._Menu,
      Menu_({key: "tools", title: 'Tools', w, entries: tools, onEntryClick: onToolToggle})._Menu
    ];
  }
}

ComponentFactory.registerType(MenuPanel);
export const MenuPanel_ = (props) => ({_MenuPanel: {type: MENU_PANEL, ...props}});