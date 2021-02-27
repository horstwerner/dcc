import P from 'prop-types';
import {fillIn} from "@symb/util";
import {Caption} from "@/components/Generators";
import TemplateElement, {StylePropType} from "@/templates/elements/TemplateElement";

export default class CaptionElement extends TemplateElement {

  static key = 'caption';

  static propTypes = {...TemplateElement.propTypes,
    text: P.string.isRequired,
    style: P.shape(StylePropType)
  }

  static create({descriptor, data}) {
    const { text } = descriptor;
    const captionText = text.includes('{{') ? fillIn(text, data) : text;
    return Caption({...descriptor, text: captionText});
  }
}