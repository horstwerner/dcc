import {RadioButtons_} from "@/components/RadioButtons";
import {getValueRange} from "@/graph/GroupedSet";
import {DropdownList_} from "@/components/DropdownList";
import {TYPE_NODES} from "@/graph/TypeDictionary";
import {Menu_} from "@/components/Menu";
import {OPTION_HIGHLIGHT} from "@/components/Constants";

const FILTER_RESET = 'core:filterReset';
export const FILTER_HEIGHT = 20;

export const createFilterControl = function createFilterControl (tool, data, onFilterSet, onFilterRemove) {

    let toolControl;
    switch (tool.display) {
      case 'radio-buttons': {
        const {id, values, width, label} = tool;
        const reset = {id: FILTER_RESET, name: 'All', onSelect: () => onFilterRemove(tool.id, FILTER_RESET)};
        const options = values.map(value => ({id: value, name: value, onSelect: () => onFilterSet(tool, value, value)}));
        options.push(reset);
        toolControl = RadioButtons_({key: id, size: {width, height: FILTER_HEIGHT}, label, options, selectedId: FILTER_RESET })._RadioButtons;
        break;
      }
      case 'dropdown': {
        const {id, width, labelWidth, filter, label} = tool;

        const nodes = data.get(TYPE_NODES);
        const valueMap = getValueRange(nodes, filter);

        const reset = {id: FILTER_RESET, name: 'All', onSelect: () => onFilterRemove(tool.id, FILTER_RESET)};

        const options = [reset, ...valueMap.map(entry => ({id: entry.id, name: entry.name, onSelect: () => onFilterSet(tool, entry.id, entry.value) }))];

        toolControl = DropdownList_({key: id, width, labelWidth, height: 200, label, options, size: {width, height: FILTER_HEIGHT}, selectedId: FILTER_RESET })._DropdownList;
        break;
      }
      default:
        throw new Error(`Unknown tool display ${tool.display}`);
    }
    return toolControl;
};

export const updatedToolControl = function updatedToolControl(tool, control, selectedId, data, onFilterSet, onFilterRemove) {

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

const  createOptionControl = function createOptionControl (key, option, onOptionSet, selected, spatial) {

  const { selection, caption } = option;

  switch (option.display) {
    case 'radio-buttons': {
      const entries = selection.map(({value, label}) => ({id: value, name: label, selected: (value === selected)}));
      return Menu_({key, title: caption,
        entries, spatial, onEntryClick: (value) => onOptionSet(key, value) })._Menu;
    }
    case OPTION_HIGHLIGHT: {
      const entries = [{value: null, label: "None"}, ...selection].map(({value, label}) => ({id: value, name: label, selected: (value === selected)}));
      return Menu_({key, title: caption,
        entries, spatial, onEntryClick: (value) => onOptionSet(key, value) })._Menu;
    }
    default:
      throw new Error(`Unknown tool display ${option.display}`);
  }
};

export const  createOptionControls = function createOptionControls(options, onOptionSet, currentSelections) {
  return Object.keys(options).map(key =>
      createOptionControl(key, options[key], onOptionSet, currentSelections[key])
  );
}
