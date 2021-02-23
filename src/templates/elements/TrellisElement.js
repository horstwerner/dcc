import P from 'prop-types';
import TemplateElement from "@/templates/elements/TemplateElement";
import Trellis from "@/generators/Trellis";
import {CLICK_NORMAL} from "@/components/Constants";
import {GRID} from "@/arrangement/GridArrangement";

export default class TrellisElement extends TemplateElement {

  static key = 'trellis';

  static propTypes = {
    ...TemplateElement.propTypes,
    source: P.string.isRequired,
    template: P.string.isRequired,
    inputSelector: P.objectOf(P.string),
    groupAttribute: P.string.isRequired,
    align: P.objectOf(P.shape({calculate: P.string.isRequired})),
    arrangement: P.shape({type: P.oneOf[GRID], lod: P.string, padding: P.number}),
  }

  static create({descriptor, data, onClick}) {
    return Trellis( data,  descriptor, onClick, CLICK_NORMAL);
  }
}