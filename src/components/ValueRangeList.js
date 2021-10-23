import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory";
import {getValueRange} from "@/graph/GroupedSet";
import css from "./ValueRangeList.css";
import {Div_} from "@symb/Div";
import {Image_} from "@symb/Image";
import TypeDictionary from "@/graph/TypeDictionary";

const VALUE_RANGE = 'valueRangeList';

class ValueRangeList extends Component{
  static type = VALUE_RANGE;
  static className = css.list;


  createChildDescriptors(props) {
    
    const { nodes, dimension, onClose, onClick, selectedId, size } = props;

    const valueMap = getValueRange(nodes, dimension);
    const heading = TypeDictionary.getType(dimension).getName();

    const options = valueMap.map(entry => ({id: entry.id, name: entry.name, onSelect: () => onClick({by: dimension, selectedId: entry.id, selectedValue: entry.value}) }));
    const buttons = options.map(option =>
        Div_({
          key: option.id,
          className: option.id === selectedId ? css.entryActive : css.entryInactive,
          title: option.name,
          children: option.name,
          onClick: option.id === selectedId ? null : option.onSelect
        })._Div);

    const headerHeight = 24;

    return [Div_({className: css.header, size:{width: size.width - 32, height: headerHeight}}, heading)._Div,
        Image_({key: 'closeButton', className: css.icon, source: 'public/CloseIcon.svg', onClick: onClose})._Image,
      Div_({className: css.itemBody, size: {height: size.height - headerHeight - 16}}, buttons)._Div];

  }

}

ComponentFactory.registerType(ValueRangeList);

export const ValueRangeList_ = (props) => ({_ValueRangeList: {...props, type: VALUE_RANGE}});