import P from 'prop-types';
import TemplateElement, {StylePropType} from "@/templates/elements/TemplateElement";
import {Link} from "@/components/Generators";
import {fillIn} from "@symb/util";

export default class LinkElement extends TemplateElement {

  static key = 'link';

  static propTypes = {...TemplateElement.propTypes,
    url: P.string,
    text: P.string,
    image: P.string,
    modal: P.bool,
    templateId: P.string,
    modalWidth: P.number,
    modalHeight: P.number,
    style: P.shape(StylePropType)
  }

  static create ({descriptor, data}) {
    const { url, templateId, text } = descriptor;
    return (url || templateId) && Link({...descriptor, text: fillIn(text, data), url: fillIn(url, data)});
  }
}
