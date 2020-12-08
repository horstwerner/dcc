import P from 'prop-types';
import Component from "@symb/Component";
import css from "./Menu.css"
import ComponentFactory from "@symb/ComponentFactory";
import {isEqual} from "lodash";
import {Div_} from "@symb/Div";

const MENU = 'menu';

class MenuPanel extends Component {
  static type = MENU;
  static className = css.menu;

  static propTypes = {
    title: P.string.isRequired,
    entries: P.array,
    w: P.number.isRequired,
  };

  updateContents(props) {
    if (isEqual(props, this.innerProps)) return;
    this.innerProps = props;

    const {title, entries, w} = props;


    const children = [Div_({className: css.title, children:title})._Div];
    if (entries) {
      entries.forEach(entry => children.push(Div_({className: css.entry, children:entry})._Div))
    }

    this.createChildren(children);
  }

}

ComponentFactory.registerType(MenuPanel);
export const Menu_ = (props) => ({_Menu: {type: MENU, ...props}});