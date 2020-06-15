import P from 'prop-types';
import CheckedObject from './CheckedObject';

export const ELEMENT_GROUP = 'group';
export const TRANSITION_REARRANGE = 'rearrange';
export const TRANSITION_NAVIGATE = 'navigation';

export const transitionPropTypes = {
  type: P.oneOf([TRANSITION_NAVIGATE,TRANSITION_REARRANGE])
};

export const navigationTransitionPropTypes = {
  type: P.exact(TRANSITION_NAVIGATE),
  target: P.string.isRequired,
  moveActors: P.arrayOf(P.shape({
    key: P.string,
    targetKey: P.string
  }))
};

const elementPositionPropTypes = {
  x: P.number.isRequired,
  y: P.number.isRequired,
  width: P.number.isRequired,
  height: P.number.isRequired,
  alpha: P.number,
  onClick: P.shape(transitionPropTypes)
};

export const mapElementPropTypes =  {
  key: P.string.isRequired,
  type: P.oneOf([ELEMENT_GROUP]).isRequired,
  source: P.string.isRequired,
  traverse: P.string,
  filter: P.string,
  ...elementPositionPropTypes
};

export default class Map extends CheckedObject {

  static propertyTypes = {
    width: P.number.isRequired,
    height: P.number.isRequired,
    backColor: P.string.isRequired,
    backdrop: P.string,
    elements: P.arrayOf(P.shape(mapElementPropTypes)),
  };

}

