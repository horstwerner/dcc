import {EMPTY, sliceBy} from "@/graph/GroupedSet";
import {LOD_FULL} from "@/components/CardSet";
import {ChildSet} from "@/components/Generators";
import {getNodeArray} from "@symb/util";
import {TYPE_CONTEXT} from "@/graph/BaseTypes";


const Trellis = function Trellis(data, descriptor, onClick, clickMode) {

  const {key, source, template, inputSelector, groupAttribute, includeRestGroup, align, arrangement, x, y, w, h} = descriptor;

  let nodes = getNodeArray(inputSelector, source, data);
  if (!nodes) return null;

  const groupedSet = sliceBy(nodes, groupAttribute);

  const groups = groupedSet
      .getKeys()
      .filter(groupKey => includeRestGroup ? true : groupKey !== EMPTY)
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

export default Trellis;
