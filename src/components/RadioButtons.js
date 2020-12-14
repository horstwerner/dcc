import P from 'prop-types';
import {isEqual} from 'lodash';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory";
import css from './RadioButtons.css';
import {Div, Div_} from "@symb/Div";

const RADIO = 'radio';

class RadioButtons extends Component {

  static type = RADIO;
  static className = css.radioBar;
  static propTypes = {
    options: P.arrayOf(P.shape({id: P.string.isRequired, name: P.string.isRequired, onSelect: P.func.isRequired})),
    selectedId: P.string.isRequired,
    orientation: P.oneOf(['horizontal', 'vertical']),
    label: P.string,
    width: P.number,
    height: P.number
  }

  updateContents(props) {
    if (isEqual(props, this.innerProps)) return;
    this.innerProps = props;

    const {orientation, width, height, label, options, selectedId} = props;

    this.updateStyle({flexDirection: (orientation === 'vertical' ? 'flex-column' : 'flex-row'), width, height});
    const children = [Div_({key: 'label', className: css.label, children: label})._Div];

    options.forEach(option => children.push(Div_({
      key: option.id,
      className: option.id === selectedId ? css.buttonActive : css.buttonInactive,
      children: option.name,
      onClick: option.id === selectedId ? null : option.onSelect
    })._Div));


    this.createChildren(children);


  }

}

ComponentFactory.registerType(RadioButtons);

export const RadioButtons_ = (props) => ({_RadioButtons: {...props, type: RADIO}});
