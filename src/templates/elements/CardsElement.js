import P from 'prop-types';
import TemplateElement from "@/templates/elements/TemplateElement";
import {LOD_FULL, LOD_RECT} from "@/components/CardSet";
import {GRID} from "@/arrangement/GridArrangement";
import {ChildSet} from "@/components/Generators";
import {CLICK_NORMAL} from "@/components/Constants";
import {TYPE_CONTEXT} from "@/graph/TypeDictionary";

export default class CardsElement extends TemplateElement {

  static key='cards';

  static propTypes = {
    ...TemplateElement.propTypes,
    source: P.string.isRequired,
    lod: P.oneOf([LOD_FULL, LOD_RECT]),
    name: P.string,
    align: P.object,
    inputSelector: P.objectOf(P.string),
    viewName: P.string,
    arrangement: P.shape({type: P.oneOf[GRID], lod: P.string, padding: P.number}),
    template: P.string,
    options: P.object
  }

  static create({descriptor, data, onClick}) {
    return ChildSet(data, data.get(TYPE_CONTEXT), descriptor, false,  onClick, CLICK_NORMAL);
  }


}