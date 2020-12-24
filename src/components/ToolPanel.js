import P from 'prop-types';
import Component from "@symb/Component";
import css from "./ToolPanel.css"
import ComponentFactory from "@symb/ComponentFactory";

const TOOL_PANEL = 'tool-panel';

class ToolPanel extends Component {
  static type = TOOL_PANEL;
  static className = css.panel;

  static propTypes = {
    tools: P.array
  };

}

ComponentFactory.registerType(ToolPanel);
export const ToolPanel_ = (props) => ({_ToolPanel: {type: TOOL_PANEL, ...props}});
