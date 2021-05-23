import {get, isEmpty, sum} from 'lodash';
import Component from "@symb/Component";
import css from "./Card.css";
import {Path_} from "./Path";
import {Card_} from "./Card";
import {getAssociated} from "@/graph/Analysis";
import {Svg_} from "@/components/Svg";
import {createContext, fit, roundCorners} from "@symb/util";
import P from "prop-types";
import GraphNode from "@/graph/GraphNode";
import ComponentFactory from "@symb/ComponentFactory";
import {CLICK_OPAQUE} from "@/components/Constants";
import TemplateRegistry from "@/templates/TemplateRegistry";
import {createPreprocessedCardNode} from "@/components/Generators";

const LANE_BREAK_THRESHOLD = 8;

const inspect = function inspect(associationName) {
  const lastPos = associationName.length - 1;
  if (associationName.charAt(lastPos) === '*') {
    return {edgeType: associationName.substring(0, lastPos), recursive: true};
  } else {
    return {edgeType: associationName, recursive: false};
  }
}

const bumpSuccessorDepth = function bumpSuccessorDepth(edgeList, depth, vizNodesByKey, touchedKeyMap) {
  if (!edgeList) return;
  edgeList.forEach(edge => {
    if (!touchedKeyMap[edge.targetKey]) {
      touchedKeyMap[edge.targetKey] = true;
      const targetVizNode = vizNodesByKey[edge.targetKey];
      if (targetVizNode.depth < depth) {
        targetVizNode.depth = depth;
        bumpSuccessorDepth(targetVizNode.outEdges, depth + 1, vizNodesByKey, touchedKeyMap);
      }
    }
  })
}

const traverseGraph = function traverseGraph(startNodes, scopeKeys, path) {
  const vizNodesByKey = {};

  startNodes.forEach(node => {vizNodesByKey[node.getUniqueKey()] = {graphNode: node, depth: 0, inEdges: [], outEdges: []}});

  let curSegmentIdx = 0;
  let depth = 0;

  let nextNodeList = startNodes;
  let accumulatedNextNodeMap = {};
  while (nextNodeList.length !== 0 && curSegmentIdx < path.length) {
    depth++;
    let nextNodeMap = {};
    const {edgeType, recursive} = inspect(path[curSegmentIdx]);
    nextNodeList.forEach(node => {
      const sourceKey = node.getUniqueKey();
      const sourceVizNode = vizNodesByKey[sourceKey];
      const associated = getAssociated(node, edgeType);
      associated.forEach(targetNode => {
        const targetKey = targetNode.getUniqueKey();
        if (scopeKeys && !scopeKeys[targetKey]) return;

        let targetVizNode = vizNodesByKey[targetKey];
        if (!targetVizNode) {
          // new node added to analysis
          sourceVizNode.outEdges.push({targetKey});
          vizNodesByKey[targetKey] = {graphNode: targetNode, depth: sourceVizNode.depth + 1, inEdges: [{sourceKey}], outEdges: []};
          nextNodeMap[targetKey] = targetNode;
          if (recursive) {
            accumulatedNextNodeMap[targetKey] = targetNode;
          }
        } else {
          sourceVizNode.outEdges.push({targetKey});
          targetVizNode.inEdges.push({sourceKey});
          // console.log(`setting ${targetKey} to ${depth}`);
          if (targetVizNode.depth < sourceVizNode.depth + 1) {
            targetVizNode.depth = sourceVizNode.depth + 1;
            bumpSuccessorDepth(targetVizNode.outEdges, targetVizNode.depth + 1, vizNodesByKey,
                {[sourceKey]: true, [targetKey]: true});
          }
        }
      });
    });
    if (recursive) {
      // only move on to next path segment if recursion exhausted, then use all recursively found nodes
      if (isEmpty(nextNodeMap)) {
        nextNodeMap = accumulatedNextNodeMap;
        accumulatedNextNodeMap = {};
        curSegmentIdx++;
      }
    } else {
      curSegmentIdx++;
    }
    nextNodeList = Object.values(nextNodeMap);
  }
  return vizNodesByKey;
}

const EDGE_COLOR = 'rgba(0,0,0,0.3)';

const createSvgPath = function createSvgPath(points, dist) {

  const d = roundCorners(points, dist, false)
  // const segments = [`M${points[0].x} ${points[0].y}`];
  // for (let idx = 1; idx < points.length; idx++) {
  //   segments.push(`L${points[idx].x} ${points[idx].y}`);
  // }
  return Path_({d, style: {fill: 'none', stroke: EDGE_COLOR, strokeWidth: 2}})._Path;
}

const GRAPH_VIZ = 'graph-viz';

class GraphViz extends Component {

  static type = GRAPH_VIZ;
  static className = css.card;

  static propTypes = {
    startNodes: P.arrayOf(P.instanceOf(GraphNode)).isRequired,
    scope: P.arrayOf(P.instanceOf(GraphNode)),
    onNodeClick: P.func,
    path: P.string.isRequired,
    w: P.number.isRequired,
    h: P.number.isRequired,
    nodeAspectRatio: P.number,
    viewName: P.string
  }

  createChildDescriptors(props) {

    const {startNodes, scope, w, h, nodeAspectRatio, path, viewName, onNodeClick} = props;

    if (!startNodes) return null;

    let scopeKeys = null;
    if (scope) {
      scopeKeys = {};
      scope.forEach(node => scopeKeys[node.getUniqueKey()] = true);
    }

    const vizNodesByKey = traverseGraph(startNodes, scopeKeys, path.split('/'));
    const depth = Math.max(...Object.values(vizNodesByKey).map(node => node.depth));

    let lanes = [];
    for (let i = 0; i <= depth; i++) {
      lanes[i] = [];
    }
    const vizNodes = Object.values(vizNodesByKey);
    vizNodes.forEach(vizNode => lanes[vizNode.depth].push(vizNode));
    lanes = lanes.filter(lane => lane && lane.length > 0);

    let maxNodesPerLane = Math.max(...lanes.map(lane => (lane.length > LANE_BREAK_THRESHOLD ? Math.ceil(lane.length / 2) : lane.length)));

    const maxChildH = 0.8 * h / (maxNodesPerLane + 1);
    const maxChildW = 0.5 * w / (lanes.length || 1);
    const maxAR = maxChildW / (maxChildH || 1);
    let childW, childH;
    const childAR = nodeAspectRatio || 1;
    if (maxAR > childAR) { // height is limiting factor
      childH = maxChildH;
      childW = childH * childAR;
    } else {
      childW = maxChildW;
      childH = childW / childAR;
    }

    const netLaneH = h - childH;
    const rasterH = netLaneH / maxNodesPerLane;

    const xStep = (w - 2 * childW) / ((lanes.length - 1) || 1);

    for (let laneIdx = 0; laneIdx < lanes.length; laneIdx++) {
      const lane = lanes[laneIdx];
      const staggered = lane.length > LANE_BREAK_THRESHOLD;

      const xCursor = childW + laneIdx * xStep +
          (laneIdx === 0 && staggered ? 0.25 * childW : 0) -
          (laneIdx === lanes.length - 1 && staggered ? 0.25 * childW : 0);

      const staggeredXCursor = [
        xCursor - 0.5 * 1.1 * childW,
        xCursor + 0.5 * 1.1 * childW,
      ];

      const laneTerminals = [];
      let laneChildW = 0;
      const lanePositions = staggered ? Math.ceil(lane.length / 2) + (lane.length % 2 === 0 ? 0.5 : 0)  : lane.length;
      let yCursor = Math.max(0, (netLaneH - rasterH * (lanePositions - 1)) / 2) + 0.5 * childH;
      const yStep = rasterH; //netLaneH / ((lane.length - 1) || 1);
      lane.forEach(node => {
        node.rank = sum(node.inEdges.map(edge => get(vizNodesByKey[edge.sourceKey],'pos.y'))) / (node.inEdges.length || 1);
      });
      lane.sort((a, b) => a.rank - b.rank);
      let count = 0;

      lane.forEach(node => {
        node.laneIdx = laneIdx;
        const offset = count++ % 2;
        if (!staggered) {
          node.pos = {x: xCursor, y: yCursor};
        } else  {
          node.pos = {x: staggeredXCursor[offset], y: yCursor + 0.5 * offset * yStep}
        }
        yCursor += yStep * (staggered ? offset : 1);

        node.terminals = laneTerminals;
        node.template = TemplateRegistry.getTemplateForSingleCard(node.graphNode.getTypeUri(), viewName || 'default');
        const { width, height } = node.template.getSize();
        node.spatial = fit(childW, childH, width, height, node.pos.x - 0.5 * childW, node.pos.y - 0.5 * childH);
        laneChildW = Math.max(laneChildW, node.spatial.scale * width);
      });

      laneTerminals[0] = (staggered ? staggeredXCursor[0]: xCursor) - 0.6 * laneChildW;
      laneTerminals[1] = (staggered ? staggeredXCursor[1]: xCursor) + 0.6 * laneChildW;

    }

    const lines = [];
    // ####################### C R E A T E   E D G E S #################################################
    vizNodes.forEach(vizNode => {
      if (!vizNode.outEdges) return;
      vizNode.outEdges.forEach(({targetKey}) => {
        const targetNode = vizNodesByKey[targetKey];
        if (targetNode.pos.x > vizNode.pos.x) { // forward edge
          lines.push([vizNode.pos,
            {x: vizNode.terminals[1], y: vizNode.pos.y},
            {x: targetNode.terminals[0], y: targetNode.pos.y},
            targetNode.pos
          ]);
        } else { // backward edge
          const dySrc = (Math.sign(targetNode.pos.y - vizNode.pos.y) || -4) * 0.28 * childH
          const dyTrg = Math.abs(targetNode.pos.y - vizNode.pos.y) < 0.6 * childH ? dySrc : -dySrc;
          lines.push([vizNode.pos,
            {x: vizNode.terminals[1], y: vizNode.pos.y},
            {x: vizNode.terminals[1], y: vizNode.pos.y + dySrc},
            {x: targetNode.terminals[0], y: targetNode.pos.y + dyTrg},
            {x: targetNode.terminals[0] , y: targetNode.pos.y},
            targetNode.pos
          ]);
        }
      });
    });

    const roundDist = 0.07 * childW;
    const children = [];
    children.push(Svg_({style:{pointerEvents: 'none'}, width: w, height: h, children: lines.map(line => createSvgPath(line, roundDist))})._Svg);

    vizNodes.forEach(vizNode => {
      const cardNode = createPreprocessedCardNode(vizNode.graphNode, createContext(), vizNode.template, null);
      const {spatial, template} = vizNode;
      children.push(Card_({key: cardNode.getUniqueKey(), data: cardNode, template, onClick: onNodeClick, clickMode: CLICK_OPAQUE, spatial})._Card)
    });

    return children;
  }
}

ComponentFactory.registerType(GraphViz);

export const GraphViz_ = (props) => ({_GraphViz: {...props, type: GRAPH_VIZ}});
