import {get, isEmpty, sum} from 'lodash';
import Component from "@symb/Component";
import css from "./Card.css";
import {Path_} from "./Path";
import {Card_} from "./Card";
import isEqual from "lodash/isEqual";
import {getAssociated} from "@/graph/Analysis";
import {Svg_} from "@/components/Svg";
import {fit, roundCorners} from "@symb/util";
import P from "prop-types";
import Template from "@/templates/Template";
import GraphNode from "@/graph/GraphNode";
import ComponentFactory from "@symb/ComponentFactory";

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
    console.log(`bumping ${edge.targetKey} to ${depth}`);
    if (!touchedKeyMap[edge.targetKey]) {
      touchedKeyMap[edge.targetKey] = true;
      const targetVizNode = vizNodesByKey[edge.targetKey];
      targetVizNode.depth = depth;
      bumpSuccessorDepth(targetVizNode.outEdges, depth + 1, vizNodesByKey, touchedKeyMap);
    } else {
      console.log(`not... already touched`);
    }
  })
}

const traverseGraph = function traverseGraph(startNodes, path) {
  const vizNodesByKey = {};

  startNodes.forEach(node => {vizNodesByKey[node.getUniqueKey()] = {graphNode: node, depth: 0, inEdges: []}});

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
      sourceVizNode.outEdges = [];
      const associated = getAssociated(node, edgeType);
      associated.forEach(targetNode => {
        // ignore circular references
        const targetKey = targetNode.getUniqueKey();
        sourceVizNode.outEdges.push({targetKey});
        let targetVizNode = vizNodesByKey[targetKey];
        if (!targetVizNode) {
          // new node added to analysis
          vizNodesByKey[targetKey] = { graphNode: targetNode, depth: sourceVizNode.depth + 1, inEdges:[{sourceKey}] };
          nextNodeMap[targetKey] = targetNode;
          if (recursive) {
            accumulatedNextNodeMap[targetKey] = targetNode;
          }
        } else {
          console.log(`setting ${targetKey} to ${depth}`);
          targetVizNode.depth = Math.max(targetVizNode.depth, sourceVizNode.depth + 1);
          targetVizNode.inEdges.push({sourceKey});
          bumpSuccessorDepth(targetVizNode.outEdges, targetVizNode.depth + 1, vizNodesByKey, {[sourceKey]: true, [targetKey] : true});
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

export default class GraphViz extends Component {

  static type = GRAPH_VIZ;
  static className = css.card;

  static propTypes = {
    startNodes: P.arrayOf(P.instanceOf(GraphNode)).isRequired,
    path: P.string.isRequired,
    w: P.number.isRequired,
    h: P.number.isRequired,
    nodeTemplate: P.instanceOf(Template).isRequired
  }

  updateContents(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }
    this.innerProps = props;

    const {startNodes, w, h, path, nodeTemplate} = props;

    const vizNodesByKey = traverseGraph(startNodes, path.split('/'));
    const depth = Math.max(...Object.values(vizNodesByKey).map(node => node.depth));

    const lanes = [];
    for (let i = 0; i <= depth; i++) {
      lanes[i] = [];
    }
    const vizNodes = Object.values(vizNodesByKey);
    vizNodes.forEach(vizNode => lanes[vizNode.depth].push(vizNode));
    const maxNodesPerLane = Math.max(...lanes.map(lane => lane.length));
    const childSize =  Math.min(0.5 * w / (lanes.length || 1), 0.7 * h / (maxNodesPerLane || 1));
    const netLaneH = h - childSize;
    const rasterH = netLaneH / maxNodesPerLane;

    const xStep = (w - 2 * childSize) / ((lanes.length - 1) || 1);
    let xCursor = childSize;

    lanes.forEach(lane => {
          let yCursor = (netLaneH - rasterH * (lane.length - 1)) / 2
          const yStep = rasterH; //netLaneH / ((lane.length - 1) || 1);
          lane.forEach(node => {
            node.rank = sum(node.inEdges.map(edge => get(vizNodesByKey[edge.sourceKey],'pos.y'))) / (node.inEdges.length || 1);
          });
          lane.sort((a, b) => a.rank - b.rank);
          lane.forEach(node => {
            node.pos = {x: xCursor, y: yCursor};
            yCursor += yStep
          });
          xCursor += xStep;
        }
    );

    const lines = [];
    const edgeDist = 0.7 * childSize;
    // ####################### C R E A T E   E D G E S #################################################
    vizNodes.forEach(vizNode => {
      if (!vizNode.outEdges) return;
      vizNode.outEdges.forEach(({targetKey}) => {
        const targetNode = vizNodesByKey[targetKey];
        if (targetNode.pos.x > vizNode.pos.x) { // forward edge
          lines.push([vizNode.pos,
            {x: vizNode.pos.x + edgeDist, y: vizNode.pos.y},
            {x: targetNode.pos.x - edgeDist, y: targetNode.pos.y},
            targetNode.pos
          ]);
        } else { // backward edge
          const dySrc = Math.sign(targetNode.pos.y - vizNode.pos.y) * 0.3 * childSize;
          const dyTrg = Math.abs(targetNode.pos.y - vizNode.pos.y) < childSize ? dySrc : -dySrc;
          lines.push([vizNode.pos,
            {x: vizNode.pos.x + edgeDist, y: vizNode.pos.y},
            {x: vizNode.pos.x + edgeDist, y: vizNode.pos.y + dySrc},
            {x: targetNode.pos.x - edgeDist, y: targetNode.pos.y + dyTrg},
            {x: targetNode.pos.x - edgeDist, y: targetNode.pos.y},
            targetNode.pos
          ]);
        }
      });
    });


    const roundDist = 0.3 * edgeDist;
    const children = [];
    children.push(Svg_({width: w, height: h, children: lines.map(line => createSvgPath(line, roundDist))})._Svg);
    const {width, height} = nodeTemplate.getSize();

    vizNodes.forEach(vizNode => {children.push(Card_({data: vizNode.graphNode, template: nodeTemplate, spatial: fit(childSize, childSize, width, height, vizNode.pos.x - 0.5 * childSize, vizNode.pos.y - 0.5 * childSize)})._Card)});

    this.createChildren(children);

  }
}

ComponentFactory.registerType(GraphViz);

export const GraphViz_ = (props) => ({_GraphViz: {...props, type: GRAPH_VIZ}});
