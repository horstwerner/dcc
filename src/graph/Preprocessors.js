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
import {resolveAttribute, TYPE_NODES} from "@/graph/Cache";
import Filter from "@/graph/Filter";
import {pathAnalysis} from "@/graph/Analysis";

export const PATH_ANALYSIS = "path-analysis";
export const AGGREGATE = "aggregate";
export const SET_CONTEXT = "set-context";

/**
 *
 * @param {GraphNode} data: modified during operation
 * @param {Object} context: modified during operation
 * @param {Object[]} preprocessors
 */
export const preprocess = function preprocess(data, context, preprocessors) {

  preprocessors.forEach(descriptor => {
    const {input, inputSelector, method, result} = descriptor;

    const filter = inputSelector ? Filter.fromDescriptor(inputSelector) : null;

    const source = filter ? resolveAttribute(data, input || TYPE_NODES).filter(filter.matches) : resolveAttribute(data, input || TYPE_NODES);
    if (source == null) {
      debugger
      if (!input) {
        throw new Error(`Can't preprocess data: no subNodes property and input undefined in ${data.getUniqueKey()}`);
      } else {
        throw new Error(`Can't preprocess data: input ${input} not present in ${data.getUniqueKey()}`);
      }
    }

    switch (method) {
      case PATH_ANALYSIS:
        const {associationType, upstreamAggregate, downstreamAggregate} = descriptor;
        data[result] = pathAnalysis(source, associationType, new Aggregator(upstreamAggregate), new Aggregator(downstreamAggregate));
        break;
      case AGGREGATE:
        const { results } = descriptor;
        const aggregator = new Aggregator(results);
        Object.assign(data , aggregator.aggregate(source));
        break;
      case SET_CONTEXT:
        const { values } = descriptor;
        Object.keys(values).forEach(targetField => context[targetField] = resolveAttribute(data, values[targetField]));
        break;
      default:
        throw new Error(`Unknown preprocessing algorithm ${method}`);
    }
  });
}