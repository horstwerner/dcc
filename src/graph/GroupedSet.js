import {mapValues} from 'lodash';
import {resolveAttribute, TYPE_NAME, TYPE_NODES} from "@/graph/Cache";
import Aggregator, {DEFAULT_AGGREGATOR} from "@/Aggregator";


const EMPTY = '__empty__';


/**
 * groups the array of data points by the specified dimension, creates a Slices instance containing these groups
 * @param {GraphNode} aggNode aggregated node
 * @param {String} dimension
 * @param {Aggregator || undefined} aggregator, will be modified
 * @return {GroupedSet} non-aggregated slices, each slice contains node array
 */
export const sliceBy = function sliceBy(aggNode, dimension, aggregator = DEFAULT_AGGREGATOR) {

  const subsets = {};
  const keyArray = [];
  const nodes = aggNode[TYPE_NODES];
  aggNode.removeBulkAssociation(TYPE_NODES);

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
  return new GroupedSet(aggNode, dimension, keyArray,
      mapValues(subsets,(nodes, key) => {
        const agg = aggregator.aggregate(nodes);
        agg[dimension] = key;
        agg[TYPE_NAME] = (key === EMPTY ? 'unspecified' : key);
        return agg;})
  );
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
   * @param {GraphNode} wholeSetAgg
   * @param {String} dimension - name of the property by which grouped
   * @param {Array<String>} keys discrete values = keys of the subsets map
   * @param {{[key]: GraphNode | GroupedSet}} groupAggByKey maps keys to content (agg nodes or Groupings)
   * @constructor
   */
  constructor (wholeSetAgg, dimension, keys, groupAggByKey) {
    this.wholeSetAgg = wholeSetAgg;
    this.dimension = dimension;
    this.keys = keys;
    this.groupAggByKey = groupAggByKey;
  }

  getWholeSetAggregation() {
    return this.wholeSetAgg;
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
    return this.groupAggByKey[key];
  };

  // for dicing purposes only
  replaceGroup(key, groupedSet) {
    this.groupAggByKey[key] = groupedSet;
  }

  forEachKey(callback) {
    for (let i = 0; i < this.keys.length; i++) {
      callback(this.keys[i], this.groupAggByKey[this.keys[i]]);
    }
  };
}



