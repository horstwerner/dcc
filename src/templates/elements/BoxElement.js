import TemplateElement, {StylePropType} from "@/templates/elements/TemplateElement";
import {Div_} from "@symb/Div";
import css from "@/components/Card.css";
import {calcStyle} from "@/components/Generators";

export default class BoxElement extends TemplateElement {

  static key = 'box';

  static propTypes = {...TemplateElement.propTypes,
    ...StylePropType
  }

  static create({descriptor}) {
    const {key, x, y, w, h, type, ...style} = descriptor;
    return Div_({key, className: css.background, size: {width: w, height: h}, spatial: {x, y, scale: 1}, style: calcStyle(style)})._Div
  }
}
