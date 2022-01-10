import P from 'prop-types';

export const StylePropType = {
  'color': P.string,
  'background-color': P.string,
  'border-radius': P.string,
  'border': P.string,
  'font-weight': P.string,
  'font-size': P.string,
  'padding': P.string,
  'z-index': P.number,
  'font-family': P.string,
  'line-height': P.number,
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
    h: P.number,
    condition: P.objectOf(P.string)
  }

  static validate(templateId, descriptor) {
    let error = false;
    const subClassPropTypes = this.prototype.constructor.propTypes;
    Object.keys(descriptor).forEach(key => {
      if (!subClassPropTypes[key]) {
        console.warn(`Warning: Template ${templateId} element ${descriptor.key} contains unsupported property ${key}`);
      }
    });
    P.checkPropTypes(subClassPropTypes, descriptor, templateId, descriptor.key || JSON.stringify(descriptor), () => {error = true; return '';})
    return error;
  }

  static create({descriptor, data, onClick}) {
  }

}