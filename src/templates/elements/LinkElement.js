import P from 'prop-types';
import TemplateElement, {StylePropType} from "@/templates/elements/TemplateElement";
import {resolveAttribute} from "@/graph/Cache";
import {Link} from "@/components/Generators";

export default class LinkElement extends TemplateElement {

  static key = 'link';

  static propTypes = {...TemplateElement.propTypes,
    urlAttribute: P.string.isRequired,
    text: P.string,
    image: P.string,
    style: P.shape(StylePropType)
  }

  static create ({descriptor, data}) {
    const { urlAttribute } = descriptor;
    const url = resolveAttribute(data, urlAttribute);
    return url && Link({...descriptor, url});
  }
}