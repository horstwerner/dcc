// "algorithm": "path-analysis",
//     "input-selector": {
//   "jira:release": {
//     "=": 1.2
//   }
// },
// "upstream-aggregate": {
//   "upstream-storypoints": {
//     "attribute": "jira-storypoints",
//         "calculate": "sum"
//   }
// },
// "downstream-aggregate": {
//   "downstream-storypoints": {
//     "attribute": "jira-storypoints",
//         "calculate": "sum"
//   }
// },
// "result": "dependencies"

import Aggregator from "@/Aggregator";
import {resolve} from "@/graph/Cache";
import Filter from "@/graph/Filter";
import {deriveAssociations, mapNode, pathAnalysis} from "@/graph/Analysis";
import {intersectLists, subtractLists, unifyLists} from "@/graph/SetOperations";
import {TYPE_NODES} from "@/graph/TypeDictionary";
import {describeSource, nodeArray} from "@symb/util";

export const CREATE_NODE = "create-node";
export const PATH_ANALYSIS = "path-analysis";
export const AGGREGATE = "aggregate";
export const SET_CONTEXT = "set-context";
export const DERIVE_ASSOCIATIONS = "derive-associations";
export const INTERSECT = "intersect";
export const UNIFY = "unify";
export const SUBTRACT = "subtract";
export const FILTER = "filter";

const getSetContents = function (data, sets, logLevel) {
  return sets.map( setName => {
    const content = data.get(setName);
    if (logLevel) {
      console.log(`${setName} is ${describeSource(content)}`);
    }
    return content;
  });
}

/**
 *
 * @param {GraphNode} data: modified during operation
 * @param {Object} context: modified during operation
 * @param {Object[]} preprocessors
 * @param {string} logLevel
 */
export const preprocess = function preprocess(data, context, preprocessors, logLevel) {

  preprocessors.forEach(descriptor => {
    const {input, inputSelector, method, result} = descriptor;

    let source;
    if (method === PATH_ANALYSIS || method === AGGREGATE || method === FILTER || method === DERIVE_ASSOCIATIONS) {
      const filter = inputSelector ? Filter.fromDescriptor(inputSelector) : null;

      if (logLevel) {
        console.log(`Method ${method}, input unfiltered:`)
      }
      const unfiltered = resolve(data, input || TYPE_NODES, logLevel);
      source = (unfiltered && filter) ? nodeArray(unfiltered).filter(filter.matches) : unfiltered;
      if (logLevel && unfiltered && filter) {
        console.log(`Filtered: ${describeSource(source)}`);
      }

      if (source == null && !input) {
        throw new Error(`Can't preprocess data: no subNodes property and input undefined in ${data.getUniqueKey()}`);
      } else if (source == null) {
        console.log(`Skipping preprocess ${method} input ${input} not present in ${data.getUniqueKey()}`);
        return;
      }
    }

    switch (method) {
      case CREATE_NODE: {
        const {type, mapping, result} = descriptor;
        data.set(result, mapNode(data, type, null, mapping, logLevel));
        break;
      }
      case PATH_ANALYSIS: {
        const {associationType, upstreamAggregate, downstreamAggregate} = descriptor;
        data.set(result, pathAnalysis(source, associationType, new Aggregator(upstreamAggregate), new Aggregator(downstreamAggregate)));
        break;
      }
      case AGGREGATE: {
        const {results} = descriptor;
        const aggregator = new Aggregator(results);
        const aggregated = aggregator.aggregate(source);
        Object.keys(aggregated).forEach(key => data.set(key, aggregated[key]));
        break;
      }
      case SET_CONTEXT: { // add key-value pairs to context object in order to be passed down
        const {values} = descriptor;
        if (logLevel) {
          console.log(`Method set-context`);
        }
        Object.keys(values).forEach(targetField => {
          if (logLevel) {
            console.log(`setting ${targetField}:`)
          }
          context.set(targetField, resolve(data, values[targetField], logLevel))
        });
        break;
      }
      case DERIVE_ASSOCIATIONS: {
        const { path, derived, recursive } = descriptor;
        data.set(result, deriveAssociations(source, path, derived, recursive, logLevel));
        break;
      }
      case UNIFY: {
        const { sets } = descriptor;
        if (logLevel) {
          console.log(`Unify: `);
        }
        const setContents = getSetContents(data, sets, logLevel);
        data.set(result, unifyLists(setContents));
        if (logLevel) {

        }
        break;
      }
      case INTERSECT: {
        const { sets } = descriptor;
        if (logLevel) {
          console.log(`Intersect: `);
        }
        const setContents = getSetContents(data, sets, logLevel);
        data.set(result, intersectLists(setContents));
        break;
      }
      case SUBTRACT: {
        if (logLevel) {
          console.log(`Subtract: `);
        }
        const { sets } = descriptor;
        const setContents = getSetContents(data, sets, logLevel);
        data.set(result, subtractLists(setContents));
        break;
      }
      case FILTER: {
        data.set(result, source);
        break;
      }
      default:
        throw new Error(`Unknown preprocessing algorithm ${method}`);
    }
  });
}
