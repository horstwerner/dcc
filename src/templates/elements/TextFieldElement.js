import P from 'prop-types';
import TemplateElement, {StylePropType} from "@/templates/elements/TemplateElement";
import {resolveAttribute} from "@/graph/Cache";
import {Caption} from "@/components/Generators";

export default class TextFieldElement extends TemplateElement {

  static key = 'textfield';

  static propTypes = {...TemplateElement.propTypes,
    attribute: P.string.isRequired,
    style: P.shape(StylePropType)
  }

  static create({descriptor, data}) {
    const {key, attribute, ...rest} = descriptor;
    const value = resolveAttribute(data, attribute);
    return Caption({
      key,
      text: value != null ? String(value) : '',
      ...rest
    });
  }

}