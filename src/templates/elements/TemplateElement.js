import P from 'prop-types';

export const StylePropType = {
  'color': P.string,
  'background-color': P.string,
  'border-radius': P.string,
  'font-weight': P.string,
  'font-size': P.string,
  'padding': P.string,
  'z-index': P.number,
  'font-family': P.string,
  'v-align': P.oneOf(['top', 'center', 'bottom']),
  'h-align': P.oneOf(['left', 'center', 'right'])
};

export const sizeType = {w: P.number, h: P.number};
export const positionType = {...sizeType, x: P.number, y: P.number};

export default class TemplateElement {

  static propTypes = {
    key: P.string.isRequired,
    type: P.string.isRequired,
    x: P.number.isRequired,
    y: P.number.isRequired,
    w: P.number,
    h: P.number
  }

  static validate(templateId, descriptor) {
    let error = false;
    P.checkPropTypes(this.constructor.propTypes, descriptor, templateId, descriptor.key || JSON.stringify(descriptor), () => {error = true; return '';})
    return error;
  }

  static create({descriptor, data, onClick}) {
  }

}