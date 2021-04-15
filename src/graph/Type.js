import P from 'prop-types';
import CheckedObject from "../CheckedObject";

export default class Type extends CheckedObject{

  static propertyTypes = {
    uri: P.string.isRequired,
    name: P.string.isRequired,
    dataType: P.oneOf(['INTEGER','STRING','FLOAT','BOOLEAN', 'ENTITY']).isRequired,
    isAssociation: P.bool.isRequired,
    subClassOf: P.string,
    inverseType: P.string
  };

  superType;
  subTypes = [];

  getInverseType (fallbackTargettype) {
    if (!this.isAssociation && !fallbackTargettype) {
      throw new Error(`Inverse type to entity ${this.name} requested without fallback target type`)
    }
    return this.inverseType || fallbackTargettype;
  }

  isOfType(superTypeUri) {
    if (this.uri === superTypeUri) return true;
    if (this.superType) return this.superType.isOfType(superTypeUri);
    return false;
  }

  getName() {
    return this.name;
  }
}
