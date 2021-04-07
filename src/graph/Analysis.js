import {get} from 'lodash';
import GraphNode from "@/graph/GraphNode";
import Cache, {
  traverse
} from "@/graph/Cache";
import {
  TYPE_AGGREGATOR,
  TYPE_DEPTH,
  TYPE_NODES,
  TYPE_PREDECESSOR_COUNT,
  TYPE_SUCCESSOR_COUNT
} from "@/graph/TypeDictionary";

export const getAssociated = function getAssociated(node, association) {

  const associated = node.get(association);
  if (associated == null) {
    return [];
  }

  if (Array.isArray(associated)) {
    return associated;
  } else {
    return [associated];
  }
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
    nextLevel.forEach(sourceContextNode => {
      const sourceKey = sourceContextNode.getUniqueKey();
      const associated = getAssociated(sourceContextNode, associationType);
      successorSetByUri[sourceKey]={};

      associated.forEach(targetNode => {
        const targetKey = targetNode.getUniqueKey();
        // ignore circular references
        if (targetKey === sourceKey || get(predecessorSetByUri,[sourceKey, targetKey])) return;
        let targetContextNode = allTouchedNodes[targetKey];
        if (!targetContextNode) {
          // new node added to analysis
          targetContextNode = targetNode.createContextual();
          allTouchedNodes[targetKey] = targetContextNode;
          nextLevelMap[targetKey] = targetContextNode;
          predecessorSetByUri[targetKey] = {};
        }
        const allPredecessorsOfTarget = predecessorSetByUri[targetKey];

        // unify known with new predecessors
        Object.assign(allPredecessorsOfTarget, predecessorSetByUri[sourceKey]);

        // register target with all _indirect_ predecessors
        Object.keys(allPredecessorsOfTarget).forEach(predecessorKey => successorSetByUri[predecessorKey][targetKey] = targetContextNode);

        //successorMap for direct predecessor was already set above in bulk, therefore we add sourceNode only now
        allPredecessorsOfTarget[sourceKey] = sourceContextNode;

        // can be overwritten - always tells the maximal depth of a node
        targetContextNode.set(TYPE_DEPTH, depth);

      });
    });
    depth++;
    nextLevel = Object.values(nextLevelMap);
  }

  // now that we know the direct and indirect predecessors and successors of each node, we can aggregate
  Object.keys(allTouchedNodes).forEach(key => {
    const node = allTouchedNodes[key];

    if (upstreamAggregator) {
      const predecessors = Object.values(predecessorSetByUri[key]);
      const aggregated = upstreamAggregator.aggregate(predecessors, TYPE_PREDECESSOR_COUNT);
      upstreamAggregator.fieldAggregations.forEach(({targetField}) => node.set(targetField, aggregated[targetField]));
    }

    if (downstreamAggregator) {
      const successors = Object.values(successorSetByUri[key]);
      const aggregated = downstreamAggregator.aggregate(successors, TYPE_SUCCESSOR_COUNT);
      downstreamAggregator.fieldAggregations.forEach(({targetField}) => node.set(targetField, aggregated[targetField]));
    }
  });

  return new GraphNode(TYPE_AGGREGATOR, Cache.createUri())
      .set('maxDepth', depth - 1)
      .setBulkAssociation(TYPE_NODES, Object.values(allTouchedNodes));
}

export const deriveAssociations = function deriveAssociations(sourceNodes, path, derivedAssociation, recursive) {
  const processedNodes = {};
  const result = [];
  let currentNodes = sourceNodes;
  while (currentNodes.length > 0) {
    let newNodes = {};
    currentNodes.forEach(node => {
      const associated = traverse(node, path);
      associated.delete(node);
      if (associated.size !== 0) {
        const contextual = node.createContextual();
        contextual.setBulkAssociation(derivedAssociation, associated);
        result.push(contextual);
        associated.forEach(node => {
          const key = node.getUniqueKey();
          if (!processedNodes[key]) {
            newNodes[key] = node;
            processedNodes[key] = true;
          }
        });
      }
    });
    if (recursive) {
      currentNodes = Object.values(newNodes);
    } else {
      currentNodes = [];
    }
  }
  return result;
}
