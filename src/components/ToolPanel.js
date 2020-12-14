import P from 'prop-types';
import {isEqual} from "lodash";
import Component from "@symb/Component";
import css from "./ToolPanel.css"
import ComponentFactory from "@symb/ComponentFactory";

const TOOL_PANEL = 'tool-panel';

class ToolPanel extends Component {
  static type = TOOL_PANEL;
  static className = css.panel;

  static propTypes = {
    tools: P.array,
    width: P.number.isRequired,
    height: P.number.isRequired,
  };

  updateContents(props) {
    if (isEqual(props, this.innerProps)) return;
    this.innerProps = {...props};

    const {width, height, children} = props;

    this.dom.style.width = `${width}px`;
    this.dom.style.height = `${height}px`;

    this.createChildren(children || []);
  }

}

ComponentFactory.registerType(ToolPanel);
export const ToolPanel_ = (props) => ({_ToolPanel: {type: TOOL_PANEL, ...props}});
