import P from 'prop-types';
import Component from "@symb/Component";
import css from "./MenuPanel.css"
import ComponentFactory from "@symb/ComponentFactory";
import {isEqual} from "lodash";
import {Menu_} from "@/components/Menu";

const MENU_PANEL = 'menu-panel';

class MenuPanel extends Component {
  static type = MENU_PANEL;
  static className = css.panel;

  static propTypes = {
    views: P.array,
    tools: P.array,
    w: P.number.isRequired,
    h: P.number.isRequired,
  };

  updateContents(props) {
    if (isEqual(props, this.innerProps)) return;
    this.innerProps = {...props};


    const {w, h} = props;

    this.dom.style.width = `${w}px`;
    this.dom.style.height = `${h}px`;

    const children = [
        Menu_({title: 'Views', w, entries: ['View1','View2','View3']})._Menu,
        Menu_({title: 'Tools', w, entries: ['Tool1','Tool2','Tool3']})._Menu
    ];

    this.createChildren(children);
  }

}

ComponentFactory.registerType(MenuPanel);
export const MenuPanel_ = (props) => ({_MenuPanel: {type: MENU_PANEL, ...props}});