import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory";
import css from './RadioButtons.css';
import {Div_} from "@symb/Div";

const RADIO = 'radio';
export const VERTICAL = 'vertical';
export const HORIZONTAL = 'horizontal';

class RadioButtons extends Component {

  static type = RADIO;
  static className = css.radioBar;

  static propTypes = {
    options: P.arrayOf(P.shape({id: P.string.isRequired, name: P.string.isRequired, onSelect: P.func.isRequired})),
    selectedId: P.string.isRequired,
    orientation: P.oneOf([HORIZONTAL, VERTICAL]),
    label: P.string,
    width: P.number,
    height: P.number
  }

  updateDom(props, tween) {
    const { orientation } = props;
    this.dom.className = orientation === VERTICAL ? css.radioPanel : css.radioBar;
    this.updateStyle({flexDirection: (orientation === VERTICAL ? 'column' : 'row')});
  }

  createChildDescriptors(props) {

    const { label, options, selectedId, orientation } = props;
    const children = [Div_({key: 'label', className: orientation === VERTICAL ? css. panelLabel : css.label, children: label})._Div];

    const inactiveStyle = orientation === VERTICAL ? css.panelButtonInactive : css.buttonInactive;
    const activeStyle = orientation === VERTICAL ? css.panelButtonActive : css.buttonActive;

    options.forEach(option => children.push(Div_({
      key: option.id,
      className: option.id === selectedId ? activeStyle : inactiveStyle,
      title: option.name,
      children: option.name,
      onClick: option.id === selectedId ? null : option.onSelect
    })._Div));

    return children;
  }

}

ComponentFactory.registerType(RadioButtons);

export const RadioButtons_ = (props) => ({_RadioButtons: {...props, type: RADIO}});
