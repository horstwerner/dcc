import P from 'prop-types';
import CheckedObject from "../CheckedObject";

export default class Type extends CheckedObject{

  static propertyTypes = {
    uri: P.string.isRequired,
    name: P.string.isRequired,
    dataType: P.oneOf(['INTEGER','STRING','FLOAT','BOOLEAN', 'ENTITY']).isRequired,
    isAssociation: P.bool.isRequired,
    inverseType: P.string
  };

  getInverseType (fallbackTargettype) {
    if (!this.isAssociation && !fallbackTargettype) {
      throw new Error(`Inverse type to entity ${this.name} requested without fallback target type`)
    }
    return this.inverseType || fallbackTargettype;
  }

}
