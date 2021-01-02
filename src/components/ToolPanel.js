import P from 'prop-types';
import Component from "@symb/Component";
import css from "./ToolPanel.css"
import ComponentFactory from "@symb/ComponentFactory";
import {MARGIN} from "@/Config";

const TOOL_PANEL = 'tool-panel';

class ToolPanel extends Component {
  static type = TOOL_PANEL;
  static className = css.panel;

  static propTypes = {
    tools: P.array
  };

  createChildDescriptors({size, children}) {
    const { height } = size;

    let xCursor = MARGIN;
    return children.map(child => {
      const spatial = {x: xCursor, y: 0.5 * (height - child.size.height), scale: 1};
      xCursor += child.size.width + MARGIN;
      return {...child, spatial};
    });
  }

}

ComponentFactory.registerType(ToolPanel);
export const ToolPanel_ = (props) => ({_ToolPanel: {type: TOOL_PANEL, ...props}});
