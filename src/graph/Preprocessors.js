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
import {describeDescriptor, describeSource, nodeArray} from "@symb/util";

export const CREATE_NODE = "create-node";
export const PATH_ANALYSIS = "path-analysis";
export const AGGREGATE = "aggregate";
export const SET_CONTEXT = "set-context";
export const DERIVE_ASSOCIATIONS = "derive-associations";
export const INTERSECT = "intersect";
export const UNIFY = "unify";
export const SUBTRACT = "subtract";
export const FIRST_FOUND = "first-found";


const getSetContents = function (data, sets, logLevel) {
  return sets.map( setName => {
    const content = data.get(setName);
    if (logLevel) {
      console.log(`${setName} is ${describeSource(content)}`);
    }
    return content;
  });
}

const getFirstFound = function (data, paths, logLevel, indent) {
  for (let i = 0; i < paths.length; i++) {
    const content = resolve(data, paths[i], logLevel, indent);
    if (logLevel) {
      console.log(`${indent || ''}${paths[i]} is ${describeSource(content)}`);
    }
    if (content && !(Array.isArray(content) && content.length === 0)) {
      return content;
    }
  }
}

const funcNeedsSourceArray = {
  [UNIFY]: true,
  [INTERSECT]: true,
  [SUBTRACT]: true,
  [FIRST_FOUND]: true};

const funcNeedsNoSource = {
  [CREATE_NODE]: true
};


/**
 *
 * @param {GraphNode} data: modified during operation
 * @param {Object} context: modified during operation
 * @param {Object[]} preprocessors
 * @param {string} logLevel
 */
export const preprocess = function preprocess(data, context, preprocessors, logLevel) {

  preprocessors.forEach(descriptor => {
    const { source, set, inputSelector } = descriptor;
    const func = descriptor['function'];
    const setContext = descriptor['set-context'];

    if (logLevel) {
      console.log(`------`);
      console.log(describeDescriptor(descriptor));
    }

    let sourceData;
    if ((source || !funcNeedsNoSource[func]) && !funcNeedsSourceArray[func]) {
      const filter = inputSelector ? Filter.fromDescriptor(inputSelector) : null;
      if (logLevel) {
        console.log(`evaluating unfiltered source:`)
      }
      const unfiltered = resolve(data, source || TYPE_NODES, logLevel);
      if ( unfiltered == null ) {
        console.log(`Skipping preprocess because no source data found for ${data.getUniqueKey()}`);
        return;
      }
      sourceData = (unfiltered && filter) ? nodeArray(unfiltered).filter(filter.matches) : unfiltered;
      if (logLevel && unfiltered && filter) {
        console.log(`Filtered: ${describeSource(sourceData)}`);
      }
    }

    let result = sourceData;
    if (funcNeedsSourceArray[func] && !Array.isArray(source)) {
      throw new Error(`Function ${func} requires array as source`);
    }

    switch (func) {
      case CREATE_NODE: {
        const {type, mapping, source} = descriptor;
        const reference = (source ? sourceData : data);
        if (!reference) return;

        if (Array.isArray(reference)) {
          result = reference.map(node => mapNode(node, type, Cache.createUri(), mapping, logLevel));
        } else {
          result = mapNode(reference, type, null, mapping, logLevel);
        }
        break;
      }
      case PATH_ANALYSIS: {
        const {associationType, upstreamAggregate, downstreamAggregate} = descriptor;
        result = pathAnalysis(sourceData, associationType, new Aggregator(upstreamAggregate), new Aggregator(downstreamAggregate));
        break;
      }
      case AGGREGATE: {
        const { set } = descriptor;
        const aggregator = new Aggregator(set);
        const aggregated = aggregator.aggregate(sourceData);
        Object.keys(aggregated).forEach(key => data.set(key, aggregated[key]));
        break;
      }
      case DERIVE_ASSOCIATIONS: {
        const { path, derived, recursive } = descriptor;
        result = deriveAssociations(sourceData, path, derived, recursive, logLevel);
        break;
      }
      case UNIFY: {
        if (logLevel) {
          console.log(`Unify: `);
        }
        const setContents = getSetContents(data, source, logLevel);
        result = unifyLists(setContents);
        break;
      }
      case INTERSECT: {
        if (logLevel) {
          console.log(`Intersect: `);
        }
        const setContents = getSetContents(data, source, logLevel);
        result = intersectLists(setContents);
        break;
      }
      case SUBTRACT: {
        if (logLevel) {
          console.log(`Subtract: `);
        }
        const setContents = getSetContents(data, source, logLevel);
        result = subtractLists(setContents);
        break;
      }
      case FIRST_FOUND: {
        if (logLevel) {
          console.log(`First Found:`);
        }
        result = getFirstFound(data, source, logLevel, '  ');
        break;
      }
    }

   if (setContext) {
      context.set(setContext, result);
    }
   if (set) {
     data.set(set, result);
   }
  });
}
