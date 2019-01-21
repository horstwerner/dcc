"use strict";

const Grouping = {};

(function () {

  const EMPTY = '__empty__';

  Grouping.AGG_COUNT = 'count';
  Grouping.AGG_SUM = 'sum';
  Grouping.AGG_MAX = 'max';
  Grouping.AGG_MIN = 'main';
  Grouping.AGG_AVG = 'avg';

  const startValue = {
    'min': Number.MAX_VALUE,
    'max': -Number.MAX_VALUE,
    'sum': 0,
    'avg': 0
  };

  const groupingMethods = [Grouping.AGG_SUM, Grouping.AGG_MIN, Grouping.AGG_MAX, Grouping.AGG_AVG];


  Grouping.FieldAggregation = function (targetField, sourceField, method) {
    this.targetField = targetField;
    this.sourceField = sourceField;
    if (groupingMethods.indexOf(method) === -1) throw new Error('Unknown aggregation method: ' + method);
    this.method = method;
  };


  /**
   *
   * @param {String} dimension - name of the property by which grouped
   * @param {Array<String>} keys discrete values = keys of the subsets map
   * @param {Object} subsets maps keys to content (node sets, slices or aggregatedvalues)
   * @constructor
   */
  Grouping.Slices = function (dimension, keys, subsets) {
    this.dimension = dimension;
    this.keys = keys;
    this.subsets = subsets;
  };


  Grouping.Slices.prototype.getNumOfSlices = function () {
    return this.keys.length;
  };


  Grouping.Slices.prototype.getSlice = function (key) {
    return this.subsets[key];
  };


  Grouping.Slices.prototype.forEachEntry = function (callback) {
    for (let i = 0; i < this.keys.length; i++) {
      callback(this.keys[i], this.subsets[this.keys[i]]);
    }
  };


  Grouping.Slices.prototype.unified = function () {
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


  Grouping.Slices.prototype.getTotal = function (aggregateProp) {
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
   *
   * @param {Array<Object>} subset
   * @param {Array<Grouping.FieldAggregation>} aggregations
   * @return {Object}
   */
  const aggregateDatapoints = Grouping.aggregateDatapoints = function (subset, aggregations) {

    const result = {};
    for (let aggIdx = 0; aggIdx < aggregations.length; aggIdx++) {
      const aggregation = aggregations[aggIdx];
      if (aggregation.method === Grouping.AGG_COUNT) {
        result[aggregation.targetField] = subset.length;
        continue;
      }
      let aggregate = startValue[aggregation.method];
      for (let i = 0; i < subset.length; i++) {
        switch (aggregation.method) {
          case Grouping.AGG_AVG:
          case Grouping.AGG_SUM:
            aggregate += subset[i][aggregation.sourceField] || 0;
            break;
          case Grouping.AGG_MAX:
            aggregate = Math.max(subset[i][aggregation.sourceField] || 0, aggregate);
            break;
          case Grouping.AGG_MIN:
            aggregate = Math.min(subset[i][aggregation.sourceField] || 0, aggregate);
            break;
        }
      }
      if (aggregation.method === Grouping.AGG_AVG) {
        aggregate /= subset.length;
      }
      result[aggregation.targetField] = aggregate;
    }
    return result;
  };


  /**
   * Replaces each subset by the aggregated value over the subset
   * flattens out any recursive slicings - this case shouldn't normally occur though
   * @param {Array<Grouping.FieldAggregation>} aggregations
   */
  Grouping.getAggregate = function (aggregations) {
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
   * @return {Grouping.Slices} non-aggregated slices, each slice contains datapoint array
   */
  const sliceBy = Grouping.sliceBy = function (dataPoints, dimension) {

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
    return new Grouping.Slices(dimension, keyArray, subsets);
  };


  /**
   * recursively subdivides an array of data points and aggregates a specified value on each level
   * @param {Array<Object>} dataPoints
   * @param {Array<String>} dimensions
   * @param {String} aggregateProperty
   * @return {Object} Tree with aggregated slices as leaves
   */
  const diceBy = Grouping.diceBy = function (dataPoints, dimensions, aggregateProperty) {
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


})();
