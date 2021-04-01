import {mapValues} from 'lodash';
import {resolveAttribute, resolveProperty} from "@/graph/Cache";
import {createCardNode} from "@symb/util";
import GraphNode from "@/graph/GraphNode";


export const EMPTY = '__empty__';


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
        cardNode[dimension] = key;
        return cardNode;})
  );
};

export const getValueMap = function getValueMap(nodes, dimension) {

  const range = {};

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const value = resolveProperty(node, dimension) || null;
    if (value) {
      const key = value.constructor === GraphNode ? value.uri : String(value);
      range[key] = value;
    } else {
      range['undefined'] = null;
    }
  }

  return range;
};


/**
 * recursively subdivides an array of data points and aggregates a specified value on each level
 * @param {GraphNode} aggNode
 * @param {Array<String>} dimensions
 * @param {Aggregator} aggregator
 * @return {GroupedSet} GroupedSet tree with Aggregation instances as leaves
 */
const diceBy = function diceBy(aggNode, dimensions, aggregator) {
  // subdivide by first dimension
  // node instances will be removed from aggregated node to avoid multiplication of nodes by levels of tree
  const result = sliceBy(aggNode, dimensions[0], aggregator);
  if (dimensions.length === 1) return result;

  // recursively subdivide each slice by the remaining dimensions
  {
    const restDimensions = dimensions.slice(1);
    const keys = result.getKeys();
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      result.replaceGroup(key, diceBy(result.getGroup(key), restDimensions, aggregator));
    }
  }
  return result;
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
    this.dimension = dimension;
    this.keys = keys;
    this.groupNodeByKey = groupNodeByKey;
  }

  getDimension() {
    return this.dimension;
  }

  getNumOfGroups() {
    return this.keys.length;
  };

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

  // for dicing purposes only
  replaceGroup(key, groupedSet) {
    this.groupNodeByKey[key] = groupedSet;
  }

  forEachKey(callback) {
    for (let i = 0; i < this.keys.length; i++) {
      callback(this.keys[i], this.groupNodeByKey[this.keys[i]]);
    }
  };
}



