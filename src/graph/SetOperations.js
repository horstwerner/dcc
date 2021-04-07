export const unifyLists = function unifyLists(lists) {
  if (lists.length < 2) {
    throw new Error('Need at least two lists as arguments for UNIFY');
  }
  const unifiedMap = {};
  lists.forEach(list => {
    list.forEach(node => {
      const nodeKey = node.getUniqueKey();
      const existing = unifiedMap[nodeKey];
      if (existing) {
        if (node.originalNode || existing.originalNode) {
          unifiedMap[nodeKey] = existing.originalNode.mergeContextual(node);
        }
      } else {
        unifiedMap[nodeKey] = node;
      }
    })
  });
  return Object.values(unifiedMap);
}

export const intersectLists = function intersectLists(lists) {
  if (lists.length < 2) {
    throw new Error('Need at least two lists as arguments for INTERSECT');
  }
  const maps = [];
  for (let i = 0; i < lists.length; i++) {
    const map = {};
    lists[i].forEach(node => {
      map[node.getUniqueKey()] = node;
    });
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
  lists[0].forEach(node => {
    map[node.getUniqueKey()] = node;
  });
  for (let i = 1; i < lists.length; i++) {
    lists[i].forEach(node => {
      if (map[node.getUniqueKey()]) {
        map[node.getUniqueKey()] = null;
      }
    });
  }
  return Object.values(map).filter(Boolean);
}
