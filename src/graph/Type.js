import P from 'prop-types';

const typeProps = {
  uri: P.string.isRequired,
  name: P.string.isRequired,
  dataType: P.oneOf(['INTEGER','STRING','FLOAT','BOOLEAN', 'ENTITY']).isRequired,
  isAssociation: P.bool.isRequired,
  inverseType: P.string
};

export default class Type {

  constructor (descriptor) {
    P.checkPropTypes(typeProps, descriptor, 'parameter', 'Type constructor');
    Object.keys(typeProps).forEach(prop => this[prop] = descriptor[prop]);
  }

  getInverseType (fallbackTargettype) {
    return this.inverseType || fallbackTargettype;
  }

}
