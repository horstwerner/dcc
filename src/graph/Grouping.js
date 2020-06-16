import clone from 'lodash/clone';
import {TYPE_NODE_COUNT} from "@/graph/Cache";

/*
 *  This is code from another project. TODO: See what parts of it are needed, remove rest
 *
 */

const EMPTY = '__empty__';

export const AGG_COUNT = 'count';
export const AGG_SUM = 'sum';
export const AGG_MAX = 'max';
export const AGG_MIN = 'main';
export const AGG_AVG = 'avg';

const startValue = {
  'min': Number.MAX_VALUE,
  'max': -Number.MAX_VALUE,
  'sum': 0,
  'count': 0
};

// const groupingMethods = [AGG_SUM, AGG_MIN, AGG_MAX, AGG_AVG];

/**
 *
 * @param {String} dimension - name of the property by which grouped
 * @param {Array<String>} keys discrete values = keys of the subsets map
 * @param {Object} subsets maps keys to content (node sets, slices or aggregatedvalues)
 * @constructor
 */
export class Slices {
  constructor (dimension, keys, subsets) {
    this.dimension = dimension;
    this.keys = keys;
    this.subsets = subsets;
  }

  getNumOfSlices = function () {
    return this.keys.length;
  };

  getSlice = function (key) {
    return this.subsets[key];
  };

  forEachEntry = function (callback) {
    for (let i = 0; i < this.keys.length; i++) {
      callback(this.keys[i], this.subsets[this.keys[i]]);
    }
  };

  unified = function () {
    let result = [];
    for (let i = 0; i < this.keys.length; i++) {
      const subset = this.subsets[this.keys[i]];
      if (Array.isArray(subset)) {
        result = result.concat(subset);
      } else if (subset.constructor && subset.constructor === Grouping.Slices) {
        result = result.concat(subset.unified());
      } else {
        result.push(subset);
      }
    }
    return result;
  };

  getTotal = function (aggregateProp) {
    let total = 0;
    for (let i = 0; i < this.keys.length; i++) {
      const subset = this.subsets[this.keys[i]];
      if (subset.constructor === Grouping.Slices) {
        total += subset.getTotal();
      } else if (Array.isArray(subset)) {
        total += aggregateDatapoints(subset, aggregateProp);
      }
      else {
        total += subset;
      }
    }
    return total;
  };
}




// Grouping.Slices.prototype.getMax = function () {
//   this.assureAggregated('getMax');
//   let max = 0;
//   for (let i = 0; i < this.keys.length; i++) {
//     const subset = this.subsets[this.keys[i]];
//     if (subset.constructor === Grouping.Slices) {
//       max = Math.max(max, subset.getTotal());
//     } else {
//       max = Math.max(max, subset);
//     }
//   }
//   return max;
// };

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
 * @param {Array<Object>} subset
 * @param {Array<Object>} aggregations
 * @return {Object}
 */
export const aggregateDatapoints = function aggregateDatapoints(subset, aggregations) {


  // efficient aggregation in two phases:  first, all required source fields are aggregated
  // then, the required
  const sourceFieldAggregates = mapToObject(aggregations, startValue);

  for (let i = 0; i < subset.length; i++) {
    Object.keys(sourceFieldAggregates).forEach(sourceField => {
      const value = Number(subset[i][sourceField]) || 0;
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


/**
 * Replaces each subset by the aggregated value over the subset
 * flattens out any recursive slicings - this case shouldn't normally occur though
 * @param {Array<Object>} aggregations
 */
const getAggregate = function getAggregate(aggregations) {
  let result = {};
  for (let i = 0; i < this.keys.length; i++) {
    const key = this.keys[i];
    const subset = this.subsets[key];
    if (Array.isArray(subset)) {
      result[key] = aggregateDatapoints(subset, aggregations);
    } else {
      throw new Error('getAggregate only allowed for leaf-level slices');
    }
  }
  return result;
};


/**
 * groups the array of data points by the specified dimension, creates a Slices instance containing these groups
 * @param {Array<Object>} dataPoints
 * @param {String} dimension
 * @return {Slices} non-aggregated slices, each slice contains datapoint array
 */
export const sliceBy = function sliceBy(dataPoints, dimension) {

  const subsets = {};
  const keyArray = [];

  for (let i = 0; i < dataPoints.length; i++) {
    const dataPoint = dataPoints[i];
    const key = dataPoint[dimension] || EMPTY;
    let group;
    if (!subsets.hasOwnProperty(key)) {
      group = [];
      subsets[key] = group;
      keyArray.push(key);
    } else {
      group = subsets[key];
    }
    group.push(dataPoint);
  }
  return new Slices(dimension, keyArray, subsets);
};


/**
 * recursively subdivides an array of data points and aggregates a specified value on each level
 * @param {Array<Object>} dataPoints
 * @param {Array<String>} dimensions
 * @param {String} aggregateProperty
 * @return {Object} Tree with aggregated slices as leaves
 */
const diceBy = function diceBy(dataPoints, dimensions, aggregateProperty) {
  // subdivide by first dimension
  const result = sliceBy(dataPoints, dimensions[0]);
  if (dimensions.length === 1) return result.getAggregate(aggregateProperty);

  // recursively subdivide each slice by the remaining dimensions
  {
    const restDimensions = dimensions.slice(1);
    for (let i = 0; i < result.keys.length; i++) {
      const key = result.keys[i];
      result.subsets[key] = diceBy(result.subsets[key], restDimensions, aggregateProperty);
    }
  }

  return result;
};


