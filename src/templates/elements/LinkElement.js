import P from 'prop-types';
import TemplateElement, {StylePropType} from "@/templates/elements/TemplateElement";
import {Link} from "@/components/Generators";
import {fillIn} from "@symb/util";

export default class LinkElement extends TemplateElement {

  static key = 'link';

  static propTypes = {...TemplateElement.propTypes,
    url: P.string.isRequired,
    text: P.string,
    image: P.string,
    style: P.shape(StylePropType)
  }

  static create ({descriptor, data}) {
    const { url } = descriptor;
    return url && Link({...descriptor, url: fillIn(url, data)});
  }
}
