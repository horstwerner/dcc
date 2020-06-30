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
import {TYPE_NODES} from "@/graph/Cache";
import Filter from "@/graph/Filter";
import {pathAnalysis} from "@/graph/Analysis";

export const PATH_ANALYSIS = "path-analysis";
export const AGGREGATE = "aggregate";

/**
 *
 * @param {GraphNode} data: modified during operation
 * @param {Object[]} preprocessors
 */
export const preprocess = function preprocess(data, preprocessors) {

  preprocessors.forEach(descriptor => {
    const {input, inputSelector, algorithm, result} = descriptor;

    const filter = inputSelector ? Filter.fromDescriptor(inputSelector) : null;

    const source = filter ? data.get(input || TYPE_NODES).filter(filter.matches) : data.get(input || TYPE_NODES);
    if (source == null) {
      if (!input) {
        throw new Error(`Can't preprocess data: no subNodes property and input undefined in ${JSON.stringify(data)}`);
      } else {
        throw new Error(`Can't preprocess data: input ${input} not present in ${JSON.stringify(data)}`);
      }
    }

    switch (algorithm) {
      case PATH_ANALYSIS:
        const {associationType, upstreamAggregate, downstreamAggregate} = descriptor;
        data[result] = pathAnalysis(source, associationType, new Aggregator(upstreamAggregate), new Aggregator(downstreamAggregate));
        break;
      case AGGREGATE:
        const { results } = descriptor;
        const aggregator = new Aggregator(results);
        Object.assign(data , aggregator.aggregate(source));
        break;
      default:
        throw new Error(`Unknown preprocessing algorithm ${algorithm}`);
    }
  });
}