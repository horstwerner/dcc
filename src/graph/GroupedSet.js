import {mapValues, sortBy} from 'lodash';
import {resolveAttribute, resolveProperty} from "@/graph/Cache";
import {createCardNode} from "@symb/util";
import GraphNode from "@/graph/GraphNode";


export const EMPTY = 'core:__empty__';


/**
 * groups the array of data points by the specified dimension, creates a Slices instance containing these groups
 * @param {Array<GraphNode>} nodes node list to slice
 * @param {String} dimension
 * @return {GroupedSet} non-aggregated slices, each slice contains node array
 */
export const sliceBy = function sliceBy(nodes, dimension) {

  const subsets = {};
  const keyArray = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const key = resolveAttribute(node,dimension) || EMPTY;
    let group;
    if (!subsets.hasOwnProperty(key)) {
      group = [];
      subsets[key] = group;
      keyArray.push(key);
    } else {
      group = subsets[key];
    }
    group.push(node);
  }
  return new GroupedSet(dimension, keyArray,
      mapValues(subsets,(nodes, key) => {
        const cardNode = createCardNode(nodes, `group-${key}`, (key === EMPTY ? 'unspecified' : key));
        cardNode.set(dimension, key);
        return cardNode;})
  );
};

export const getValueRange = function getValueRange(nodes, dimension) {

  const range = {};
  let hasUndefined = false;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const value = resolveProperty(node, dimension) || null;
    if (value) {
      if (GraphNode.isGraphNode(value)) {
        range[value.getUniqueKey()] = {id: value.getUniqueKey(), name: value.getDisplayName(), value};
      } else {
        range[String(value)] = {id: value, name: value, value};
      }
    } else {
      hasUndefined = true;
    }
  }

  const result = [];
  if (hasUndefined) {
    result.push ({id: EMPTY, name: '- undefined -', value: null})
  }

  return [...result, ...sortBy(Object.values(range), 'name')];

};



// const groupingMethods = [AGG_SUM, AGG_MIN, AGG_MAX, AGG_AVG];


export class GroupedSet {
  /**
   *
   * @param {String} dimension - name of the property by which grouped
   * @param {Array<String>} keys discrete values = keys of the subsets map
   * @param {{[key]: GraphNode | GroupedSet}} groupNodeByKey maps keys to content (agg nodes or Groupings)
   * @constructor
   */
  constructor ( dimension, keys, groupNodeByKey) {
    this.keys = keys;
    this.groupNodeByKey = groupNodeByKey;
  }

  getKeys() {
    return this.keys;
  }

  /**
   *
   * @param key
   * @return {GraphNode | GroupedSet} aggregated node, pointing to subnodes with association TYPE_NODES or Grouping
   */
  getGroup(key) {
    return this.groupNodeByKey[key];
  };

}



