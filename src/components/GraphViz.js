import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import sum from 'lodash/sum';
import {centerPoint, createContext, directionAngle, fit, roundCorners} from '@symb/util';
import Component from "@symb/Component";
import cardCss from "./Card.css";
import graphCss from "./Graph.css";
import {Path_} from "./Path";
import {Card_} from "./Card";
import {getAssociated} from "@/graph/Analysis";
import {Svg_} from "@/components/Svg";
import P from "prop-types";
import GraphNode from "@/graph/GraphNode";
import ComponentFactory from "@symb/ComponentFactory";
import {CLICK_OPAQUE, DEFAULT_MUTE_COLOR} from "@/components/Constants";
import TemplateRegistry from "@/templates/TemplateRegistry";
import {createPreprocessedCardNode, Link} from "@/components/Generators";
import PathParser from "@symb/PathParser";
import {resolveAttribute, traverse} from "@/graph/Cache";
import mapValues from "lodash/mapValues";
import {Div_} from "@symb/Div";

const LANE_BREAK_THRESHOLD = 8;

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

  const segments = new PathParser(path).getSegments();
  startNodes.forEach(node => {vizNodesByKey[node.getUniqueKey()] = {graphNode: node, depth: 0, inEdges: [], outEdges: []}});

  let curSegmentIdx = 0;

  let nextNodeList = startNodes;
  let accumulatedNextNodeMap = {};
  while (nextNodeList.length !== 0 && curSegmentIdx < segments.length) {
    let nextNodeMap = {};
    const {edgeType, multiStep, recursive} = segments[curSegmentIdx];
    for (let node of nextNodeList) {
      const sourceKey = node.getUniqueKey();
      const sourceVizNode = vizNodesByKey[sourceKey];
      const associated = multiStep ? Array.from(traverse(node, edgeType)) : getAssociated(node, edgeType);
      for (let targetNode of associated) {
        const targetKey = targetNode.getUniqueKey();
        if (scopeKeys && !scopeKeys[targetKey]) continue;

        let targetVizNode = vizNodesByKey[targetKey];
        if (!targetVizNode) {
          // new node added to analysis
          sourceVizNode.outEdges.push({targetKey, segmentIndex: curSegmentIdx});
          vizNodesByKey[targetKey] = {graphNode: targetNode, depth: sourceVizNode.depth + 1, inEdges: [{sourceKey, segmentIndex: curSegmentIdx}], outEdges: []};
          nextNodeMap[targetKey] = targetNode;
          if (recursive) {
            accumulatedNextNodeMap[targetKey] = targetNode;
          }
        } else {
          sourceVizNode.outEdges.push({targetKey, segmentIndex: curSegmentIdx});
          targetVizNode.inEdges.push({sourceKey, segmentIndex: curSegmentIdx});
          if (targetVizNode.depth < sourceVizNode.depth + 1) {
            targetVizNode.depth = sourceVizNode.depth + 1;
            bumpSuccessorDepth(targetVizNode.outEdges, targetVizNode.depth + 1, vizNodesByKey,
                {[sourceKey]: true, [targetKey]: true});
          }
        }
      }
    }
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

const createSvgPath = function createSvgPath(line, dist) {

  const {points, color} = line;

  const d = roundCorners(points, dist, false)
  // const segments = [`M${points[0].x} ${points[0].y}`];
  // for (let idx = 1; idx < points.length; idx++) {
  //   segments.push(`L${points[idx].x} ${points[idx].y}`);
  // }
  return Path_({d, style: {fill: 'none', stroke: color, strokeWidth: 2}})._Path;
}

const layoutSimpleLane = function layoutSimpleLanes(lanes, laneIdx, childW, xStep, netLaneH, rasterH, childH, vizNodesByKey, viewName) {

    const staggered = lanes.length > LANE_BREAK_THRESHOLD;

    const lane = lanes[laneIdx];

    const xCursor = childW + laneIdx * xStep +
      (laneIdx === 0 && staggered ? 0.25 * childW : 0) -
      (laneIdx === lanes.length - 1 && staggered ? 0.25 * childW : 0);

    const staggeredXCursor = [
      xCursor - 0.5 * 1.1 * childW,
      xCursor + 0.5 * 1.1 * childW,
    ];

    const laneTerminals = [];
    let laneChildW = 0;
    const lanePositions = staggered ? Math.ceil(lane.length / 2) + (lane.length % 2 === 0 ? 0.5 : 0) : lane.length;
    let yCursor = Math.max(0, (netLaneH - rasterH * (lanePositions - 1)) / 2) + 0.5 * childH;
    const yStep = rasterH;
    lane.forEach(node => {
      node.rank = sum(node.inEdges.map(edge => get(vizNodesByKey[edge.sourceKey], 'pos.y'))) / (node.inEdges.length || 1);
    });
    lane.sort((a, b) => a.rank - b.rank);
    let count = 0;

    lane.forEach(node => {
      node.laneIdx = laneIdx;
      const offset = count++ % 2;
      if (!staggered) {
        node.pos = {x: xCursor, y: yCursor};
      } else {
        node.pos = {x: staggeredXCursor[offset], y: yCursor + 0.5 * offset * yStep}
      }
      yCursor += yStep * (staggered ? offset : 1);

      node.terminals = laneTerminals;
      node.template = TemplateRegistry.getTemplateForSingleCard(node.graphNode.getTypeUri(), viewName || 'default');
      const {width, height} = node.template.getSize();
      node.spatial = fit(childW, childH, width, height, node.pos.x - 0.5 * childW, node.pos.y - 0.5 * childH);
      laneChildW = Math.max(laneChildW, node.spatial.scale * width);
    });

    laneTerminals[0] = (staggered ? staggeredXCursor[0] : xCursor) - 0.6 * laneChildW;
    laneTerminals[1] = (staggered ? staggeredXCursor[1] : xCursor) + 0.6 * laneChildW;

}

const layoutSwimLanes = function layoutSwimLanes(lane, laneIdx, swimLanePosY, childW, xStep, netLaneH, rasterH, childH, vizNodesByKey, viewName) {

    const xCursor = childW + laneIdx * xStep + xStep;
    const swimLaneYCursor = mapValues(swimLanePosY, y =>  y * rasterH + 0.5 * childH);

    const laneTerminals = [];
    let laneChildW = 0;


    lane.forEach(node => {
      node.rank = sum(node.inEdges.map(edge => get(vizNodesByKey[edge.sourceKey], 'pos.y'))) / (node.inEdges.length || 1);
    });
    lane.sort((a, b) => a.rank - b.rank);

    lane.forEach(node => {
      node.laneIdx = laneIdx;

      node.pos = {x: xCursor, y: swimLaneYCursor[node.swimLane]};

      swimLaneYCursor[node.swimLane] += rasterH;

      node.terminals = laneTerminals;
      node.template = TemplateRegistry.getTemplateForSingleCard(node.graphNode.getTypeUri(), viewName || 'default');
      const { width, height } = node.template.getSize();
      node.spatial = fit(childW, childH, width, height, node.pos.x - 0.5 * childW, node.pos.y - 0.5 * childH);
      laneChildW = Math.max(laneChildW, node.spatial.scale * width);
    });

    laneTerminals[0] = xCursor - 0.6 * laneChildW;
    laneTerminals[1] = xCursor + 0.6 * laneChildW;

}

const GRAPH_VIZ = 'graph-viz';

class GraphViz extends Component {

  static type = GRAPH_VIZ;
  static className = cardCss.card;

  static propTypes = {
    startNodes: P.arrayOf(P.instanceOf(GraphNode)).isRequired,
    scope: P.arrayOf(P.instanceOf(GraphNode)),
    onNodeClick: P.func,
    path: P.string.isRequired,
    w: P.number.isRequired,
    h: P.number.isRequired,
    nodeAspectRatio: P.number,
    viewName: P.string,
    muteColor: P.string,
    edgeColor: P.string,
    edgeAnnotations: P.arrayOf(P.shape({pointsRight: P.bool, helpTemplate: P.string})),
    swimLanes: P.string
  }

  createChildDescriptors(props) {

    const {startNodes, scope, w, h, nodeAspectRatio, path, viewName, onNodeClick, highlightCondition, muteColor,
      edgeColor, edgeAnnotations, swimLanes} = props;

    if (!startNodes) return null;

    let scopeKeys = null;
    if (scope) {
      scopeKeys = {};
      scope.forEach(node => scopeKeys[node.getUniqueKey()] = true);
    }

    const vizNodesByKey = traverseGraph(startNodes, scopeKeys, path);
    const depth = Math.max(...Object.values(vizNodesByKey).map(node => node.depth));

    // vertical lanes, not swimlanes
    let lanes = [];
    for (let i = 0; i <= depth; i++) {
      lanes[i] = [];
    }
    const vizNodes = Object.values(vizNodesByKey);
    vizNodes.forEach(vizNode => lanes[vizNode.depth].push(vizNode));
    lanes = lanes.filter(lane => lane && lane.length > 0);

    // horizontal lanes
    let swimLaneHeight;
    let swimLanePosY = {};
    if (swimLanes) {
      const swimLaneHeights = {};
      for (let vNode of vizNodes) {
        vNode.swimLane = String(resolveAttribute(vNode.graphNode, swimLanes) || 'none');
        if (!swimLaneHeights[vNode.swimLane]) {
          swimLaneHeights[vNode.swimLane] = [];
        }
        swimLaneHeights[vNode.swimLane][vNode.depth] = (swimLaneHeights[vNode.swimLane][vNode.depth] || 0) + 1;
      }
      swimLaneHeight = mapValues(swimLaneHeights, heights => Math.max(...(heights.filter(Boolean))));
      for (let laneName of Object.keys(swimLaneHeights)) {

      }
    }

    const maxNodesPerLane =
      swimLanes
        ? Object.values(swimLaneHeight).reduce((sum, count) => sum + count, 0)
        : Math.max(...lanes.map(lane => (lane.length > LANE_BREAK_THRESHOLD
          ? Math.ceil(lane.length / 2)
          : lane.length)))
    ;

    const maxChildH = 0.8 * h / (maxNodesPerLane + 1);
    const maxChildW = 0.5 * w / (lanes.length + swimLanes ? 1 : 0 || 1);
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

    const swimLaneOrder = Object.keys(swimLaneHeight).sort();

    const children = [];
    if (swimLanes) {
      let y = 0;
      for (let key of swimLaneOrder) {
        swimLanePosY[key] = y;
        y += swimLaneHeight[key];
      }
      const col = ['#E0E0E0','rgba(0,0,0,0)'];
      let colIdx = 0;
      for (let key of swimLaneOrder) {
        children.push(Div_({className: graphCss.lane, spatial: {x: 0, y: swimLanePosY[key] * rasterH, scale: 1}, size: {width: w, height: swimLaneHeight[key] * rasterH}, style: {backgroundColor: col[colIdx]}}, key)._Div)
        colIdx = 1 - colIdx;
      }
    }

    const xStep = (w - 2 * childW) / ((lanes.length + (swimLanes ? 1 : 0) - 1) || 1);

    for (let laneIdx = 0; laneIdx < lanes.length; laneIdx++) {
      const lane = lanes[laneIdx];
      if (swimLanes) {
        layoutSwimLanes(lane, laneIdx, swimLanePosY, childW, xStep, netLaneH, rasterH, childH, vizNodesByKey, viewName);
      } else {
        layoutSimpleLane(lanes, laneIdx, childW, xStep, netLaneH, rasterH, childH, vizNodesByKey, viewName);
      }
    }

    const lines = [];
    // ####################### C R E A T E   E D G E S #################################################
    vizNodes.forEach(vizNode => {
      if (!vizNode.outEdges) return;
      const startMuted = highlightCondition && (!highlightCondition.matches(vizNode.graphNode));
      vizNode.outEdges.forEach(({targetKey, segmentIndex}) => {
        const targetNode = vizNodesByKey[targetKey];
        const targetMuted = highlightCondition && (!highlightCondition.matches(targetNode.graphNode));
        let points;
        let centerIdx;
        if (targetNode.pos.x > vizNode.pos.x) { // forward edge
          points = [vizNode.pos,
            {x: vizNode.terminals[1], y: vizNode.pos.y},
            {x: targetNode.terminals[0], y: targetNode.pos.y},
            targetNode.pos
          ];
          centerIdx = 1;
        } else { // backward edge
          const dySrc = (Math.sign(targetNode.pos.y - vizNode.pos.y) || -4) * 0.28 * childH
          const dyTrg = Math.abs(targetNode.pos.y - vizNode.pos.y) < 0.6 * childH ? dySrc : -dySrc;
          points = [vizNode.pos,
            {x: vizNode.terminals[1], y: vizNode.pos.y},
            {x: vizNode.terminals[1], y: vizNode.pos.y + dySrc},
            {x: targetNode.terminals[0], y: targetNode.pos.y + dyTrg},
            {x: targetNode.terminals[0] , y: targetNode.pos.y},
            targetNode.pos
          ];
          centerIdx = 2;
        }
        const color = (startMuted || targetMuted) ? muteColor || DEFAULT_MUTE_COLOR : edgeColor || EDGE_COLOR;
        lines.push({points, centerIdx, color, segmentIndex, key: `${vizNode.graphNode.getUniqueKey()}->${targetKey}`});
      });
    });

    const roundDist = 0.07 * childW;
    children.push(Svg_({style:{pointerEvents: 'none'}, width: w, height: h, children: lines.map(line => createSvgPath(line, roundDist))
    })._Svg);

    if (edgeAnnotations) {
      for (let {points, centerIdx, segmentIndex, key} of lines) {
        const {pointsRight, helpTemplate} = edgeAnnotations[segmentIndex];
        const p1 = points[centerIdx];
        const p2 = points[centerIdx + 1];
        const size = 10;
        const centerP = centerPoint(p1, p2);
        let angle = 180 * directionAngle(p1, p2) / Math.PI;
        if (!pointsRight) {
          angle = angle + 180;
        }
        const arrow = Link({
          key,
          modal: true,
          x: centerP.x -0.5 * size, y: centerP.y - 0.5 * size, w: size, h: size,
          image: 'public/EdgeArrow.svg',
          className: graphCss.edgeArrow,
          rotate: angle,
          templateId: helpTemplate
        })
        children.push(arrow);
      }
    }

    vizNodes.forEach(vizNode => {
      const cardNode = createPreprocessedCardNode(vizNode.graphNode, createContext(), vizNode.template, null);
      const {spatial, template} = vizNode;
      const deEmphasized = highlightCondition && !highlightCondition.matches(cardNode);
      const deEmphasizeColor = deEmphasized && (muteColor || DEFAULT_MUTE_COLOR);
      children.push(Card_({key: cardNode.getUniqueKey(), data: cardNode, template, onClick: onNodeClick, clickMode: CLICK_OPAQUE, spatial, deEmphasizeColor})._Card)
    });

    return children;
  }


}

ComponentFactory.registerType(GraphViz);

export const GraphViz_ = (props) => ({_GraphViz: {...props, type: GRAPH_VIZ}});
