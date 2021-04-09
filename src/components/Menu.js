import P from 'prop-types';
import Component from "@symb/Component";
import css from "./Menu.css"
import ComponentFactory from "@symb/ComponentFactory";
import {Div_} from "@symb/Div";

const MENU = 'menu';

export const calcMenuHeight = function calcMenuHeight(entries) {
  return 22 * (entries.length + 1) + 12;
}

class MenuPanel extends Component {
  static type = MENU;
  static className = css.menu;

  static propTypes = {
    title: P.string.isRequired,
    entries: P.arrayOf(P.shape({id: P.string.isRequired, name: P.string.isRequired, selected: P.bool.isRequired})),
    onEntryClick: P.func,
    w: P.number.isRequired,
  };

  updateDom(props, tween) {
    const { entries } = props;
    const height = calcMenuHeight(entries);
    this.updateSize({ height }, tween);
  }

  createChildDescriptors(props) {

    const {title, entries, onEntryClick} = props;

    const children = [Div_({className: css.title, children:title})._Div];
    if (entries) {
      entries.forEach(entry => children.push(Div_({className: entry.selected ? css.entrySelected : css.entry, title: entry.name, children:entry.name, onClick: () => onEntryClick(entry.id)})._Div))
    }

    return children;
  }

}

ComponentFactory.registerType(MenuPanel);
export const Menu_ = (props) => ({_Menu: {type: MENU, ...props}});