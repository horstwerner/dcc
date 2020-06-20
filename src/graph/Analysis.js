import {get} from 'lodash';
import GraphNode from "@/graph/GraphNode";
import Cache, {
  TYPE_AGGREGATOR,
  TYPE_DEPTH,
  TYPE_NODES,
  TYPE_PREDECESSOR_COUNT,
  TYPE_SUCCESSOR_COUNT
} from "@/graph/Cache";
import Aggregator from "@/Aggregator";

const getAssociatedMap = function getAssociatedMap(node, association) {
  const map = {};
  const associated = node.get(association);
  if (associated == null) {
    return null;
  }

  if (Array.isArray(associated)) {
     associated.forEach(target =>
         map[target.getUniqueKey()] = target);
  } else if (associated.constructor === GraphNode) {
    map[associated.getUniqueKey()] = associated;
  }
  return map;
};

/**
 *
 * recursively evaluates all paths from the specified source node set.
 * For each of the passed nodes it creates a contextual node, which has the attribute
 * core:depth which is the maximum distance from one of the source nodes.
 * It aggregates over all direct and indirect predecessors of each node with the upstreamAggregator
 * and over all direct and indirect successors with the downstreamAggregator
 * However the aggregators do not take into account particular paths
 *
 * @param {GraphNode[]} sourceNodes
 * @param {String} associationType
 * @param {Aggregator} upstreamAggregator - applied to prdecessor set of each node to calc contextual values
 * @param {Aggregator} downstreamAggregator - applied to successor set of each node to calc contextual values
 * @return a set of contextual nodes representing all nodes touched in the analysis
 */
export const pathAnalysis = function pathAnalysis(sourceNodes, associationType, upstreamAggregator, downstreamAggregator) {

  let depth = 0;
  let predecessorSetByUri = {};
  let successorSetByUri = {};

  // map of uniqueID to contextual nodes
  let allTouchedNodes = {};
  let nextLevel = sourceNodes.map(node => {
    const key = node.getUniqueKey();
    const contextual = node.createContextual();
    allTouchedNodes[key] = contextual;
    predecessorSetByUri[key] = {}
    return contextual;
  });

  while (nextLevel.length > 0) {
    const nextLevelMap = {};
    nextLevel.forEach(sourceNode => {
      const sourceKey = sourceNode.getUniqueKey();
      console.log(`processing ${sourceKey}`);
      const associatedMap = getAssociatedMap(sourceNode, associationType);
      // dead end
      if (!associatedMap) {
        successorSetByUri[sourceKey]={};
        console.log(`no associations`);
        return;
      }
      successorSetByUri[sourceKey] = associatedMap;
      Object.keys(associatedMap).forEach(targetKey => {
        // ignore circular references
        if (targetKey === sourceKey || get(predecessorSetByUri,[sourceKey, targetKey])) return;
        let targetNode = allTouchedNodes[targetKey];
        if (!targetNode) {
          // new node added to analysis
          console.log(`adding ${targetKey}`);
          targetNode = associatedMap[targetKey].createContextual();
          allTouchedNodes[targetKey] = targetNode;
          nextLevelMap[targetKey] = targetNode;
          predecessorSetByUri[targetKey] = {};
        } else {
          console.log(`found ${targetKey}`);
        }
        const allPredecessorsOfTarget = predecessorSetByUri[targetKey];

        // unify known with new predecessors
        Object.assign(allPredecessorsOfTarget, predecessorSetByUri[sourceKey]);

        // register target with all _indirect_ predecessors
        Object.keys(allPredecessorsOfTarget).forEach(predecessorKey => successorSetByUri[predecessorKey][targetKey] = targetNode);

        //successorMap for direct predecessor was already set above in bulk, therefore we add sourceNode only now
        allPredecessorsOfTarget[sourceKey] = sourceNode;

        // can be overwritten - always tells the maximal depth of a node
        targetNode[TYPE_DEPTH] = depth;

      });
    });
    console.log(`Nextlevel = ${JSON.stringify(Object.keys(nextLevelMap))}`)
    depth++;
    nextLevel = Object.values(nextLevelMap);
  }

  // now that we know the direct and indirect predecessors and successors of each node, we can aggregate
  Object.keys(allTouchedNodes).forEach(key => {
    const node = allTouchedNodes[key];

    if (upstreamAggregator) {
      const predecessors = Object.values(predecessorSetByUri[key]);
      const aggregated = upstreamAggregator.aggregate(predecessors, TYPE_PREDECESSOR_COUNT);
      upstreamAggregator.fieldAggregations.forEach(({targetField}) => node[targetField] = aggregated[targetField]);
    }

    if (downstreamAggregator) {
      const successors = Object.values(successorSetByUri[key]);
      const aggregated = downstreamAggregator.aggregate(successors, TYPE_SUCCESSOR_COUNT);
      downstreamAggregator.fieldAggregations.forEach(({targetField}) => node[targetField] = aggregated[targetField]);
    }
  });

  return new GraphNode(TYPE_AGGREGATOR, Cache.createUri())
      .setAttributes({maxDepth: depth - 1})
      .setBulkAssociation(TYPE_NODES, Object.values(allTouchedNodes));
}