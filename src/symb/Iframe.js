import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory";
import P from "prop-types";

export const IFRAME = 'iframe';

class Iframe extends Component {

  static baseTag = 'iframe';
  static type = IFRAME;

  static propTypes = {
    ...Component.propTypes,
    url: P.string,
  };

  constructor(props) {
    super(props);
  }


  updateDom(props) {
    const {size, url} = props;
    this.dom.setAttribute('src', url);
    this.dom.setAttribute('width', size.width);
    this.dom.setAttribute('height', size.height);
  }
}

ComponentFactory.registerType(Iframe);

export const IFrame_ = (props) => ({_IFrame: {type: IFRAME, ...props}});
