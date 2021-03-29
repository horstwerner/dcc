import {RadioButtons_, VERTICAL} from "@/components/RadioButtons";
import {TYPE_NODES} from "@/graph/Cache";
import {MARGIN} from "@/Config";
import {getValueMap} from "@/graph/GroupedSet";
import {DropdownList_} from "@/components/DropdownList";
import GraphNode from "@/graph/GraphNode";

const FILTER_RESET = 'core:filterReset';
export const FILTER_HEIGHT = 20;

const valueName = (value) => value.constructor === GraphNode ? value.getDisplayName() : String(value);

export const createFilterControl = function createFilterControl (tool, data, onFilterSet, onFilterRemove) {

    let toolControl;
    switch (tool.display) {
      case 'radio-buttons': {
        const {id, values, width, label} = tool;
        const reset = {id: FILTER_RESET, name: 'All', onSelect: () => onFilterRemove(tool.id)};
        const options = values.map(value => ({id: value, name: value, onSelect: () => onFilterSet(tool, value)}));
        options.push(reset);
        toolControl = RadioButtons_({key: id, size: {width, height: FILTER_HEIGHT}, label, options, selectedId: FILTER_RESET })._RadioButtons;
        break;
      }
      case 'dropdown': {
        const {id, width, labelWidth, filter, label} = tool;

        const nodes = data[TYPE_NODES];
        const valueMap = getValueMap(nodes, filter);

        const reset = {id: FILTER_RESET, name: 'All', onSelect: () => onFilterRemove(tool.id)};

        const options = [reset, ...Object.keys(valueMap).map(key => ({id: key, name: valueName(valueMap[key]), onSelect: () => onFilterSet(tool, valueMap[key]) }))];

        toolControl = DropdownList_({key: id, width, labelWidth, height: 200, label, options, size: {width, height: FILTER_HEIGHT}, selectedId: FILTER_RESET })._DropdownList;
        break;
      }
      default:
        throw new Error(`Unknown tool display ${tool.display}`);
    }
    return toolControl;
};

export const updatedToolControl = function updatedToolControl(tool, control, selectedValue, data, onFilterSet, onFilterRemove) {

  let selectedId;
  if (selectedValue) {
    selectedId = selectedValue.constructor === GraphNode ? selectedValue.id : selectedValue;
  } else {
    selectedId = FILTER_RESET;
  }

  let updatedControl;
  switch (tool.display) {
    case 'radio-buttons':
    case 'dropdown':
      updatedControl = {...control, selectedId};
      break;
    case 'trellis':
      updatedControl = createFilterControl(tool, data, onFilterSet, onFilterRemove);
      break;
  }
  return updatedControl;
}

const createOptionControl = function createOptionControl (key, option, onOptionSet, width, spatial, selected) {

  const {selection, caption} = option;

  let optionControl;
  switch (option.display) {
    case 'radio-buttons': {
      const options = selection.map(({value, label}) => ({id: value, name: label, onSelect: () => onOptionSet(key, value)}));
      const height = 25 * options.length + 36;
      optionControl = RadioButtons_({key, orientation: VERTICAL, size: {width, height}, label: caption,
        options, spatial, selectedId: selected })._RadioButtons;
      break;
    }
    default:
      throw new Error(`Unknown tool display ${option.display}`);
  }
  return optionControl;
};


export const createOptionControls = function createOptionControls(options, onOptionSet, currentSelections, width, x, y) {
  let yCursor = y;
  return Object.keys(options).map(key => {
    const spatial = {x, y: yCursor, scale: 1 };
    const control = createOptionControl(key, options[key], onOptionSet, width, spatial, currentSelections[key]);
    yCursor += control.size.height + MARGIN;
    return control;
  });
}
