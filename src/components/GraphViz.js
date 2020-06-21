import {get, isEmpty, sum} from 'lodash';
import Component from "@symb/Component";
import css from "./Card.css";
import {Path_} from "./Path";
import {Card_} from "./Card";
import isEqual from "lodash/isEqual";
import {getAssociated} from "@/graph/Analysis";
import {Svg_} from "@/components/Svg";
import {fit} from "@symb/util";
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
          vizNodesByKey[targetKey] = { graphNode: targetNode, depth, inEdges:[{sourceKey}] };
          nextNodeMap[targetKey] = targetNode;
          if (recursive) {
            accumulatedNextNodeMap[targetKey] = targetNode;
          }
        } else {
          targetVizNode.depth = depth;
          targetVizNode.inEdges.push({ sourceKey });
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
  return {vizNodesByKey, depth};
}

const EDGE_COLOR = 'rgba(0,0,0,0.7)';

const createSvgPath = function createSvgPath(points) {
  const segments = [`M${points[0].x} ${points[0].y}`];
  for (let idx = 1; idx < points.length; idx++) {
    segments.push(`L${points[idx].x} ${points[idx].y}`);
  }
  return Path_({d: segments.join(), style: {fill: 'none', stroke: EDGE_COLOR, strokeWidth: 2}})._Path;
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

    const {vizNodesByKey, depth} = traverseGraph(startNodes, path.split('/'));

    const lanes = [];
    for (let i = 0; i <= depth; i++) {
      lanes[i] = [];
    }
    const vizNodes = Object.values(vizNodesByKey);
    vizNodes.forEach(vizNode => lanes[vizNode.depth].push(vizNode));
    const maxNodesPerLane = Math.max(...lanes.map(lane => lane.length));
    const childSize =  Math.min(0.8 * w / (lanes.length || 1), 0.7 * h / (maxNodesPerLane || 1));
    const netLaneH = h - childSize;

    const xStep = (w - 2 * childSize) / ((lanes.length - 1) || 1);
    let xCursor = childSize;

    lanes.forEach(lane => {
          let yCursor = lane.length === 1 ? h / 2 : childSize / 2;
          const yStep = netLaneH / ((lane.length - 1) || 1);
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
    vizNodes.forEach(vizNode => {
      if (!vizNode.outEdges) return;
      vizNode.outEdges.forEach(({targetKey}) => {
        const targetNode = vizNodesByKey[targetKey];
        if (targetNode.pos.x > vizNode.pos.x) { // forward edge
          lines.push([vizNode.pos,
            {x: vizNode.pos.x + childSize, y: vizNode.pos.y},
            {x: targetNode.pos.x - childSize, y: targetNode.pos.y},
            targetNode.pos
          ]);
        } else { // backward edge
          const dySrc = Math.sign(targetNode.pos.y - vizNode.pos.y) * childSize;
          const dyTrg = Math.abs(targetNode.pos.y - vizNode.pos.y) < childSize ? dySrc : - dySrc;
          lines.push([vizNode.pos,
            {x: vizNode.pos.x + childSize, y: vizNode.pos.y},
            {x: vizNode.pos.x + childSize, y: vizNode.pos.y + dySrc},
            {x: targetNode.pos.x - childSize, y: targetNode.pos.y + dyTrg},
            {x: targetNode.pos.x - childSize, y: targetNode.pos.y},
            targetNode.pos
          ]);
        }
      });
    });

    const children = [];
    children.push(Svg_({width: w, height: h, children: lines.map(line => createSvgPath(line))})._Svg);
    const {width, height} = nodeTemplate.getSize();

    vizNodes.forEach(vizNode => {children.push(Card_({data: vizNode.graphNode, template: nodeTemplate, spatial: fit(childSize, childSize, width, height, vizNode.pos.x - 0.5 * childSize, vizNode.pos.y - 0.5 * childSize)})._Card)});

    this.createChildren(children);

  }
}

ComponentFactory.registerType(GraphViz);

export const GraphViz_ = (props) => ({_GraphViz: {...props, type: GRAPH_VIZ}});
