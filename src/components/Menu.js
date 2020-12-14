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
    entries: P.arrayOf(P.shape({id: P.string.isRequired, name: P.string.isRequired, selected: P.bool.isRequired})),
    onEntryClick: P.func,
    w: P.number.isRequired,
  };

  updateContents(props) {
    if (isEqual(props, this.innerProps)) return;
    this.innerProps = {...props};

    const {title, entries, onEntryClick, w} = props;

    const height = 22 * (entries.length + 1) + 12;
    this.updateStyle({height});

    const children = [Div_({className: css.title, children:title})._Div];
    if (entries) {
      entries.forEach(entry => children.push(Div_({className: entry.selected ? css.entrySelected : css.entry, children:entry.name, onClick: () => onEntryClick(entry.id)})._Div))
    }

    this.createChildren(children);
  }

}

ComponentFactory.registerType(MenuPanel);
export const Menu_ = (props) => ({_Menu: {type: MENU, ...props}});