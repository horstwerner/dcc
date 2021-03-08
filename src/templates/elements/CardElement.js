import P from 'prop-types';
import TemplateElement from "@/templates/elements/TemplateElement";
import {ChildSet} from "@/components/Generators";
import {TYPE_CONTEXT} from "@/graph/Cache";
import {CLICK_NORMAL} from "@/components/Constants";

export default class CardElement extends TemplateElement {

  static key = 'card';

  static propTypes = {
    ...TemplateElement.propTypes,
    source: P.string,
    name: P.string,
    align: P.object,
    inputSelector: P.objectOf(P.string),
    viewName: P.string,
    template: P.string,
    options: P.object
  }

  static create({descriptor, data, onClick}) {
    return ChildSet(data, data.get(TYPE_CONTEXT), descriptor, true, onClick, CLICK_NORMAL);
  }

}
