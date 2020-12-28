import {RadioButtons_, VERTICAL} from "@/components/RadioButtons";
import {Div_} from "@symb/Div";
import Trellis from "@/generators/Trellis";
import {TYPE_NODES} from "@/graph/Cache";
import {CLICK_OPAQUE} from "@/components/Constants";
import css from "./App.css";
import {MARGIN} from "@/Config";

const FILTER_RESET = 'reset';

export const createFilterControl = function createFilterControl (tool, data, onFilterSet, onFilterRemove) {

    //FIXME: update tools when filter is set

    let toolControl;
    switch (tool.display) {
      case 'radio-buttons': {
        const {id, values, width, height, label} = tool;
        const reset = {id: FILTER_RESET, name: 'All', onSelect: () => onFilterRemove(tool.id)};
        const options = values.map(value => ({id: value, name: value, onSelect: () => onFilterSet(tool, value)}));
        options.push(reset);
        toolControl = RadioButtons_({key: id, size: {width, height}, label, options, selectedId: FILTER_RESET })._RadioButtons;
        break;
      }
      case 'trellis':
        const {id, width, height, filter, align, arrangement, template} = tool;
        // const reset = {id: FILTER_RESET, name: 'All', onSelect: () => onFilterRemove(tool.id)};

        toolControl = Div_({
          className: css.absolute,
          key: `filter ${id}`,
          size: { width, height },
          children: Trellis(data, {key: id, source: TYPE_NODES, template, inputSelector: null,
                groupAttribute: filter, align, arrangement, x: 0, y: 0, w: width, h: height
              },

              ({component}) => {
                const dataValue = component.innerProps.data[filter];
                onFilterSet(tool, dataValue);},
              CLICK_OPAQUE)
        })._Div;
        break;
      default:
        throw new Error(`Unknown tool display ${tool.display}`);
    }
    return toolControl;
};

export const updatedToolControl = function updatedToolControl(tool, control, selectedValue) {
  const updatedControl = {...control};
  switch (tool.display) {
    case 'radio-buttons':
      updatedControl.selectedId = selectedValue || FILTER_RESET;
      break;
  }
  return updatedControl;
}


const createOptionControl = function createOptionControl (key, option, onOptionSet, width, height, spatial, selected) {

  const {selection, caption} = option;

  let optionControl;
  switch (option.display) {
    case 'radio-buttons': {
      const options = selection.map(({value, label}) => ({id: value, name: label, onSelect: () => onOptionSet(key, value)}));
      optionControl = RadioButtons_({key, orientation: VERTICAL, size: {width, height}, label: caption,
        options, spatial, selectedId: selected })._RadioButtons;
      break;
    }
    default:
      throw new Error(`Unknown tool display ${option.display}`);
  }
  return optionControl;
};


export const createOptionControls = function createOptionControls(options, onOptionSet, currentSelections, width, height, x, y) {
  let yCursor = y;
  return Object.keys(options).map(key => {
    const spatial = {x, y: yCursor, scale: 1 };
    yCursor += height + MARGIN;
    return createOptionControl(key, options[key], onOptionSet, width, height, spatial, currentSelections[key])
  });
}
