import P from 'prop-types';
import {resolveAttribute} from './graph/Cache';
import clone from "lodash/clone";
import {DEBUG_MODE} from "@/Config";
import {TYPE_NODE_COUNT} from "@/graph/TypeDictionary";

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
 * @param {String?} nodeCountName
 * @return {Object} keys are targetFields, values the respective aggregated values
 */
export const aggregateNodes = function aggregateNodes(subset, aggregations, nodeCountName) {

  // efficient aggregation in two phases:  first, all required source fields are aggregated
  // then, the required
  const sourceFieldAggregates = mapToObject(aggregations, startValue);

  for (let i = 0; i < subset.length; i++) {
    Object.keys(sourceFieldAggregates).forEach(sourceField => {
      const value = Number(subset[i].get(sourceField) || 0);
      const aggregator = sourceFieldAggregates[sourceField];
      aggregator.min = Math.min(aggregator.min, value);
      aggregator.max = Math.max(aggregator.max, value);
      aggregator.sum += value;
      if ( subset[i][sourceField] != null) {
        aggregator.count++;
      }
    });
  }

  const result = {[nodeCountName || TYPE_NODE_COUNT]: subset.length};
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

  // aggregate: {
  //      total: {attribute: 'revenue', calculate: 'sum'},
  //      average: {attribute: 'revenue', calculate: 'avg'}
  //     }

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
   * @param {String?} nodeCountName
   * @return {Object}
   */
  aggregate(nodes, nodeCountName) {
    return aggregateNodes(nodes, this.fieldAggregations, nodeCountName);
  }

}

export const DEFAULT_AGGREGATOR = new Aggregator({});
