import P from 'prop-types';
import Cache, {resolveAttribute, TYPE_AGGREGATOR, TYPE_NODE_COUNT, TYPE_NODES} from './graph/Cache';
import GraphNode from "@/graph/GraphNode";
import clone from "lodash/clone";
import {DEBUG_MODE} from "@/Config";

export const AGG_COUNT = 'count';
export const AGG_SUM = 'sum';
export const AGG_MAX = 'max';
export const AGG_MIN = 'min';
export const AGG_AVG = 'avg';

const startValue = {
  'min': Number.MAX_VALUE,
  'max': -Number.MAX_VALUE,
  'sum': 0,
  'count': 0
};

export const sum = function sum(nodes, attribute) {
  return nodes.reduce((result, node) => result + Number(resolveAttribute(node, attribute) || 0), 0);
}


/**
 * used to create an empty accumulator with the specified start values
 * @param array
 * @param value
 * @return {{}}
 */
const mapToObject = function mapToObject(array,  value) {
  const result = {};
  array.forEach(element => {
    result[element.sourceField] = clone(value);
  });
  return result;
};

/**
 *
 * Low-level aggregation method
 *
 * @param {Array<Object>} subset
 * @param {Array<{sourceField: string, targetField: string, method: string}>} aggregations
 * @return {Object} keys are targetFields, values the respective aggregated values
 */
export const aggregateNodes = function aggregateNodes(subset, aggregations) {

  // efficient aggregation in two phases:  first, all required source fields are aggregated
  // then, the required
  const sourceFieldAggregates = mapToObject(aggregations, startValue);

  for (let i = 0; i < subset.length; i++) {
    Object.keys(sourceFieldAggregates).forEach(sourceField => {
      const value = Number(subset[i][sourceField] || 0);
      const aggregator = sourceFieldAggregates[sourceField];
      aggregator.min = Math.min(aggregator.min, value);
      aggregator.max = Math.max(aggregator.max, value);
      aggregator.sum += value;
      if ( subset[i][sourceField] != null) {
        aggregator.count++;
      }
    });
  }

  const result = {[TYPE_NODE_COUNT]: subset.length};
  for (let aggIdx = 0; aggIdx < aggregations.length; aggIdx++) {
    const aggregation = aggregations[aggIdx];
    switch (aggregation.method) {
      case AGG_SUM:
      case AGG_MIN:
      case AGG_MAX:
      case AGG_COUNT:
        result[aggregation.targetField] = sourceFieldAggregates[aggregation.sourceField][aggregation.method];
        break;
      case AGG_AVG:
        result[aggregation.targetField] = sourceFieldAggregates[aggregation.sourceField].sum / (sourceFieldAggregates[aggregation.sourceField].count || 1);
        break;
      default:
        throw new Error(`Unknown aggregation method: ${aggregation.method}`);
    }
  }
  return result;
};


export default class Aggregator {

  // sampleTemplate = {
  //   aggregations:
  //     {total: {attribute: 'revenue', method: 'sum'},
  //      average: {attribute: 'revenue', method: 'avg'}
  //     },
  //   derived: {
  //      caption: '{{count}} Items',
  //      totalText: '{{total}}$ total revenue',
  //      avgText: '{{average}}$ average revenue'
  //   }
  // }


  static propTypes = P.objectOf(P.shape({attribute: P.string, calculate: P.string})).isRequired;

  /**
   * aggregation key is name of the aggregated attribute, aggregation is of format {attribute: string, calculate: string}
   * texts can contain handlebars containing aggregated attribute names, which will then be replaced by the respective
   * values
   * @param aggregations: {[key]: {attribute: string, calculate:string}}
   */
  constructor(aggregations) {

    if (DEBUG_MODE) {
      P.checkPropTypes(Aggregator.propTypes, aggregations, 'prop', 'Aggregator');
    }

    this.fieldAggregations = [];
    Object.keys(aggregations).forEach(key => {
      const descriptor = aggregations[key];
      this.fieldAggregations.push({targetField:key, sourceField: descriptor.attribute, method: descriptor.calculate});
    });
  }

  getAggregatedAttributeNames() {
    return this.fieldAggregations.map(({targetField}) => targetField);
  }

  /**
   *
   * @param {GraphNode[]} nodes
   * @return {GraphNode}
   */
  aggregate(nodes) {
    const aggregated = aggregateNodes(nodes, this.fieldAggregations);

    return new GraphNode(TYPE_AGGREGATOR, Cache.createUri())
        .setAttributes(aggregated)
        .setBulkAssociation(TYPE_NODES, nodes);
  }

}

export const DEFAULT_AGGREGATOR = new Aggregator({});