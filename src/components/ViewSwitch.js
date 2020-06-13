import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory";
import { FlexBox_} from "@symb/Div";
import {Button_} from "@/components/Button";

export const VIEWSWITCH = 'viewswitch';

export default class ViewSwitch extends Component {

  static type = VIEWSWITCH;

  static propTypes = {
    views: P.arrayOf(P.string)
  };

  updateContents(props) {
    this.innerProps = props;
    this.createChildren(
        FlexBox_({flexDirection: 'vertical'},
          views.map(view => Button_({text: view, onClick: () => onViewSelect(view)})._Button)
        )._FlexBox
    );

    this.createChildren(children);
  };
}

ComponentFactory.registerType(ViewSwitch);

export const ViewSwitch_ = (props) => ({_ViewSwitch: {type: VIEWSWITCH, ...props}});
