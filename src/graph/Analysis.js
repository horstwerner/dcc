import get from 'lodash/get';
import GraphNode from "@/graph/GraphNode";
import Cache, {
  resolve,
  traverse
} from "@/graph/Cache";
import {
  TYPE_AGGREGATOR,
  TYPE_DEPTH,
  TYPE_NODES,
  TYPE_PREDECESSOR_COUNT,
  TYPE_SUCCESSOR_COUNT
} from "@/graph/TypeDictionary";
import {BLANK_NODE_URI, LOG_LEVEL_PATHS} from "@/components/Constants";
import {describeSource} from "@symb/util";

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

export const deriveAssociations = function deriveAssociations(sourceNodes, path, derivedAssociation, recursive, logLevel) {
  const processedNodes = sourceNodes.reduce((map, node) => {map[node.getUniqueKey()] = true; return map;}, {});
  const spaces = '  ';
  const result = [];
  let currentNodes = sourceNodes;
  while (currentNodes.length > 0) {
    let newNodes = {};
    if (logLevel === LOG_LEVEL_PATHS) {
      console.log(`  traversing ${path}`);
    }
    currentNodes.forEach(node => {
      if (logLevel === LOG_LEVEL_PATHS) {
        console.log(`  for ${node.uri}`);
      }
      const associated = traverse(node, path, logLevel, spaces);
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
      if (logLevel) {
        console.log(`recursive derivation for ${describeSource(currentNodes)}`);
      }
    } else {
      currentNodes = [];
    }
  }
  if (logLevel) {
    console.log(`  result of deriveAssociations is ${describeSource(result)}`);
  }
  return result;
}

export const mapNode = function (referenceNode, typeUri, uri, mapping, logLevel) {
  let result = uri ? Cache.getNodeByUri(uri) : null;
  // Assumption: data immutable, no different mappings for same node
  if (result) return result;
  result = uri ? Cache.getNode(typeUri, uri) : new GraphNode(typeUri, BLANK_NODE_URI);
  Object.keys(mapping).forEach(key => {
    if (logLevel) {console.log(`  assigning ${key}:`)}
    result.set(key, resolve(referenceNode, mapping[key], logLevel, '  '));
  });

  return result;
}
