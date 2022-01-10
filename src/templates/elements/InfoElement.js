import P from 'prop-types';
import TemplateElement from "@/templates/elements/TemplateElement";
import {Link} from "@/components/Generators";

export default class ImageElement extends TemplateElement {

  static key = 'info';

  static propTypes = {
    ...TemplateElement.propTypes,
    size: P.number,
    modalSource: P.string,
    modalWidth: P.number,
    modalHeight: P.number,
    templateId: P.string
  }

  static create({descriptor}) {
    const {key, x, y, size, modalSource, modalWidth, modalHeight, templateId} = descriptor;
      return Link({
        key,
        x, y, w: size, h: size,
        image: 'public/InfoIcon.svg',
        url: modalSource,
        templateId,
        modal: true,
        modalWidth,
        modalHeight
      })
    }
}
