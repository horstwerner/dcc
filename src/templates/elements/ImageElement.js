import P from 'prop-types';
import pick from 'lodash/pick';
import TemplateElement, {StylePropType} from "@/templates/elements/TemplateElement";
import {Image_} from "@symb/Image";
import css from "@/components/Card.css";
import {calcStyle, STYLE_ATTRIBUTES} from "@/components/Generators";

export default class ImageElement extends TemplateElement {

  static key = 'image';

  static propTypes = {...TemplateElement.propTypes,
    source: P.string.isRequired,
    ...StylePropType
  }

  static create({descriptor}) {
    const { key, x, y, w, h, source, color } = descriptor;
    const style = pick(descriptor, STYLE_ATTRIBUTES);
    return Image_({key, source, color, className: css.background, width: w, height: h, spatial: {x, y, scale: 1}, style: calcStyle(style)})._Image
  }
}