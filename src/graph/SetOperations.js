import GraphNode from "@/graph/GraphNode";
import {nodeArray} from "@symb/util";

export const unifyLists = function unifyLists(lists) {
  if (lists.length < 2) {
    throw new Error('Need at least two lists as arguments for UNIFY');
  }
  const unifiedMap = {};
  for (let list of lists) {
    if (!list) continue;
    for (let node of (GraphNode.isGraphNode(list) ? [list] : list)) {
      const nodeKey = node.getUniqueKey();
      const existing = unifiedMap[nodeKey];
      if (existing) {
        if (node.originalNode || existing.originalNode) {
          unifiedMap[nodeKey] = existing.originalNode.mergeContextual(node);
        }
      } else {
        unifiedMap[nodeKey] = node;
      }
    }
  }
  return Object.values(unifiedMap);
}

export const intersectLists = function intersectLists(lists) {
  if (lists.length < 2) {
    throw new Error('Need at least two lists as arguments for INTERSECT');
  }
  const maps = [];
  for (let list of lists) {
    if (!list) continue;
    const map = {};
    if (list) {
      for (let node of nodeArray(list)) {
        map[node.getUniqueKey()] = node;
      }
    }
    maps.push(map);
  }
  for (let i = 1; i < lists.length; i++) {
    Object.keys(maps[0]).forEach(key => {
      if (maps[0][key] && !maps[i][key]) {
        maps[0][key] = null;
      }
    })
  }
  return Object.values(maps[0]).filter(Boolean);
}

export const subtractLists = function subtractLists(lists) {
  if (lists.length < 2) {
    throw new Error('Need at least two lists as arguments for SUBTRACT');
  }
  const map = {};
  const list0 = lists[0];
  if (!list0) return [];
  for (let node of nodeArray(list0)) {
    map[node.getUniqueKey()] = node;
  }
  for (let i = 1; i < lists.length; i++) {
    const list = lists[i];
    for (let node of nodeArray(list)) {
      if (map[node.getUniqueKey()]) {
        map[node.getUniqueKey()] = null;
      }
    }
  }
  return Object.values(map).filter(Boolean);
}
