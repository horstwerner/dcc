import P from 'prop-types';
import TemplateElement, {StylePropType} from "@/templates/elements/TemplateElement";
import {Image_} from "@symb/Image";
import css from "@/components/Card.css";
import {calcStyle} from "@/components/Generators";

export default class ImageElement extends TemplateElement {

  static key = 'image';

  static propTypes = {...TemplateElement.propTypes,
    source: P.string.isRequired,
    ...StylePropType
  }

  static create({descriptor}) {
    const {key, x, y, w, h, source, color, type, ...style} = descriptor;
    return Image_({key, source, color, className: css.background, width: w, height: h, spatial: {x, y, scale: 1}, style: calcStyle(style)})._Image
  }
}