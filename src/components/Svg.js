import P from 'prop-types';
import css from './Card.css';
import ComponentFactory from '@symb/ComponentFactory';
import Component from "@symb/Component";
import isEqual from "lodash/isEqual";
import {DEBUG_MODE} from "@/Config";

const SVGNS = "http://www.w3.org/2000/svg";
const SVG = 'svg';
const DEFS = 'defs';
export const RADIAL_GRADIENT = 'radialGradient';

export const Stop = function Stop(props) {

  if (DEBUG_MODE) {
    P.checkPropTypes(Stop.propTypes, props, 'prop', 'Stop');
  }

  const {percent, color, opacity} = props;

  const result = document.createElementNS(SVGNS, 'stop');
  result.setAttribute( 'offset', String(Number(percent) / 100));
  result.setAttribute('stop-color', color);
  if (opacity) {
    result.setAttribute( 'stop-opacity', opacity);
  }
  return result;
}

Stop.propTypes = {percent: P.string.isRequired, color: P.string.isRequired, opacity: P.number};

const RadialGradient = function RadialGradient(props) {

  if (DEBUG_MODE) {
    P.checkPropTypes(RadialGradient.propTypes, props, 'prop', 'RadialGradient');
  }

  const {id, cx, cy, radius, stops} = props;

  const grad = document.createElementNS(SVGNS, 'radialGradient');
  grad.setAttribute( 'id', id);
  grad.setAttribute( 'cx', cx);
  grad.setAttribute( 'cy', cy);
  grad.setAttribute( 'r', radius);
  grad.setAttribute( 'gradientUnits','userSpaceOnUse');

  stops.forEach(stopDescriptor => grad.appendChild(Stop(stopDescriptor)));
  return grad;
}

RadialGradient.propTypes = {
  id: P.string.isRequired,
  cx: P.number.isRequired,
  cy: P.number.isRequired,
  radius: P.number.isRequired,
  stops: P.arrayOf(P.shape(Stop.propTypes)).isRequired
}


class Svg extends Component {

  static baseTag = 'svg';
  static type = SVG;
  static className = css.card;

  static propTypes = {
    width: P.number.isRequired,
    height: P.number.isRequired,
    defs: P.arrayOf(P.shape({type: P.string.isRequired, id: P.string.isRequired}))
  };

  updateContents(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }
    this.innerProps = props;
    const {children, width, height, defs} = props;
    if (defs) {
      let defDomEl = this.dom.getElementsByTagName(DEFS)[0];
      if (defDomEl) {
        // clear
        defDomEl.innerHtml = '';
      } else {
        defDomEl = document.createElementNS(SVGNS, DEFS);
        defs.forEach(def => {
          switch (def.type) {
            case RADIAL_GRADIENT:
              defDomEl.appendChild(RadialGradient(def))
              break;
            default:
              throw new Error(`Unknown def type in ${JSON.stringify(def)}`);
          }
        });
        this.dom.insertBefore(defDomEl, this.dom.firstChild);
      }
    }

    // this.dom.setAttribute('overflow', 'visible')
    this.dom.setAttribute('width', width);
    this.dom.setAttribute('height', height);
    this.createChildren(children);
  }

}

ComponentFactory.registerType(Svg);

export const Svg_ = (props) => ({_Svg: {type: SVG, nameSpace: SVGNS, ...props}});
