import P from "prop-types";
import {DEBUG_MODE} from "./Config";

/**
 * Emulating strong typing by checking for presence of specified properties in constructor
 * Checking can be switched off for better performance
 */
export default class CheckedObject {

  constructor(descriptor) {
    if (DEBUG_MODE) {
      let error = false;
      if (!this.constructor.propertyTypes) {
        throw new Error(`Missing static member propertyTypes in CheckedObject subclass ${this.constructor.name}`);
      }
      P.checkPropTypes(this.constructor.propertyTypes, descriptor, 'parameter', 'Type',()=>{error = true;});
      if (error) {
        console.log(`... in ${JSON.stringify(descriptor)}`);
      }
    }
    Object.keys(this.constructor.propertyTypes).forEach(prop => this[prop] = descriptor[prop]);
  }

}
