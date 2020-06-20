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

/**
 *
 * @param data
 * @param descriptor
 * @return {Object} extends the ingoing data object by the results of the specified preprocessor
 */
export const preprocess = function preprocess(data, descriptor) {
  const {inputSelector, algorithm, result} = descriptor;

  const filter = inputSelector ? Filter.fromDescriptor(inputSelector): null;

  const input = filter ? data[TYPE_NODES].filter(filter.matches) : data[TYPE_NODES];

  let output;

  switch (algorithm) {
    case PATH_ANALYSIS:
      const {associationType, upstreamAggregate, downstreamAggregate} = descriptor;
      output =  pathAnalysis(input, associationType, new Aggregator(upstreamAggregate), new Aggregator(downstreamAggregate));
      break;
    default:
      throw new Error(`Unknown preprocessing algorithm ${algorithm}`);
  }

  return {...data, [result]: output};

}