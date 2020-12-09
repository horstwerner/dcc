import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory";
import { FlexBox_} from "@symb/Div";
import {Button_} from "@/components/Button";

export const VIEW_SWITCH = 'viewswitch';

export default class ViewSwitch extends Component {

  static type = VIEW_SWITCH;

  static propTypes = {
    views: P.arrayOf(P.string)
  };

  updateContents(props) {
    this.innerProps = {...props};

    this.createChildren(
        FlexBox_({flexDirection: 'vertical'},
          views.map(view => Button_({text: view, onClick: () => onViewSelect(view)})._Button)
        )._FlexBox
    );
  };
}

ComponentFactory.registerType(ViewSwitch);

export const ViewSwitch_ = (props) => ({_ViewSwitch: {type: VIEW_SWITCH, ...props}});
