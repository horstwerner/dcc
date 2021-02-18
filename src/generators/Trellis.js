import {DEBUG_MODE} from "@/Config";
import P from "prop-types";
import {EMPTY, sliceBy} from "@/graph/GroupedSet";
import {LOD_FULL} from "@/components/CardSet";
import {ChildSet} from "@/components/Generators";
import {TYPE_CONTEXT} from "@/graph/Cache";
import {getNodeArray} from "@symb/util";


const Trellis = function Trellis(data, descriptor, onClick, clickMode) {

  if (DEBUG_MODE) {
    P.checkPropTypes(Trellis.propTypes, descriptor, 'prop', 'Trellis');
  }

  const {key, source, template, inputSelector, groupAttribute, align, arrangement, x, y, w, h} = descriptor;

  let nodes = getNodeArray(inputSelector, source, data);
  if (!nodes) return null;

  const groupedSet = sliceBy(nodes, groupAttribute);

  const groups = groupedSet
      .getKeys()
      .filter(groupKey => groupKey !== EMPTY)
      .sort()
      .map(groupKey =>  groupedSet.getGroup(groupKey));

  return ChildSet(groups,
      data.get(TYPE_CONTEXT),
      {key,
        source: 'this',
        template,
        lod: LOD_FULL,
        align,
        arrangement,
        x, y, w, h},
      false,
      onClick,
      clickMode);
}

Trellis.propTypes = {
  ...ChildSet.propTypes,
  groupAttribute: P.string
}

export default Trellis;