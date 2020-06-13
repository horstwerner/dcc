import P from "prop-types";
import Template from "@/templates/Template";
import Component from "@symb/Component";
import isEqual from "lodash/isEqual";

export default class SubdividedGroup extends Component {

  static type = SUBGROUPS;
  // noinspection JSUnusedGlobalSymbols
  static baseTag = 'div';
  static className = css.card;

  // noinspection JSUnusedGlobalSymbols
  static propTypes = {
    template: P.instanceOf(Template),
    arrangement: P.oneOf(['vertical', 'horizontal']),
    width: P.number,
    height: P.number,
    data: P.object,
  };

  constructor(descriptor, domNode) {
    super(descriptor, domNode);

  }

  updateContents(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }
    this.innerProps = props;
    //FIXME: implement

  }
}