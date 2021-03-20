import {pick} from 'lodash';
import TemplateElement, {StylePropType} from "@/templates/elements/TemplateElement";
import {Div_} from "@symb/Div";
import css from "@/components/Card.css";
import {calcStyle, STYLE_ATTRIBUTES} from "@/components/Generators";

export default class BoxElement extends TemplateElement {

  static key = 'box';

  static propTypes = {...TemplateElement.propTypes,
    ...StylePropType
  }

  static create({descriptor}) {
    const { key, x, y, w, h } = descriptor;
    const style = pick(descriptor, STYLE_ATTRIBUTES);
    return Div_({key, className: css.background, size: {width: w, height: h}, spatial: {x, y, scale: 1}, style: calcStyle(style)})._Div
  }
}
