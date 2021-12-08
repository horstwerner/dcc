import isEqual from 'lodash/isEqual';
import mapValues from 'lodash/mapValues';
import Cache, {resolve, resolveAttribute} from "@/graph/Cache";

import GraphNode from "@/graph/GraphNode";
import Filter from "@/graph/Filter";
import TypeDictionary from "@/graph/TypeDictionary";
import {BLANK_NODE_URI} from "@/components/Constants";
import {TYPE_AGGREGATOR, TYPE_CONTEXT, TYPE_NAME, TYPE_NODE_COUNT, TYPE_NODES, TYPE_THING} from "@/graph/BaseTypes";

export function getTransformString(x, y, scale) {
  return `translate(${Math.round(x)}px, ${Math.round(y)}px) scale(${scale})`;
}

export const fit = function fit(parentWidth, parentHeight, childWidth, childHeight, xOffset, yOffset, maxScale) {

  const scale = Math.min(parentWidth / childWidth, parentHeight / childHeight, (maxScale || 100));
  if (isNaN(scale) || scale === 0) {
    throw new Error('Invalid parameters for fit');
  }
  const x = Math.max(0, (parentWidth - childWidth * scale) / 2) + (xOffset || 0);
  const y = Math.max(0, (parentHeight - childHeight * scale) / 2) + (yOffset || 0);

  if (isNaN(scale) || isNaN(x) || isNaN(y)) {
    throw new Error('call to fit with invalid parameters');
  }

  return {x, y, scale};
}

const findParameters = function findParameters(text) {
  const result = {};
  let startPos = text.indexOf('{{');

  while (startPos !== -1) {
    const endPos = text.indexOf('}}', startPos + 2);
    if (endPos === -1) {
      console.warn(`malformed text template: ${text}`);
    }
    result[text.substring(startPos + 2, endPos)] = true;
    startPos = text.indexOf('{{', endPos + 2);
  }
  return Object.keys(result);
}

export const fillIn = function fillIn(textTemplate, data) {
  const parameters = findParameters(textTemplate);
  let result = textTemplate;
  for (let i = 0; i < parameters.length; i++) {
    const parameter = parameters[i];
    const placeHolder = `{{${parameter}}}`;
    const value = resolveAttribute(data, parameter);
    result = result.split(placeHolder).join(value != null ? String(value) : '');
  }
  return result;
}

export const flexHorizontalAlign = function flexHorizontalAlign(hAlign) {
  switch (hAlign) {
    case 'left': return 'flex-start';
    case 'right': return 'flex-end';
    case 'center': return 'center';
    default: return 'flex-start';
  }
}

export const flexVerticalAlign = function flexVerticalAlign(vAlign) {
  switch (vAlign) {
    case 'top': return 'flex-start';
    case 'bottom': return 'flex-end';
    case 'center': return 'center';
    default: return 'flex-start';
  }
}

const dist = function dist (p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

const interpolate = function interpolate(p1, p2, length) {
  if (!p1 || !p2) {
    debugger
  }
  const d = Math.max(dist(p1, p2), 2 * length);
  return {x: p1.x + length / d * (p2.x - p1.x), y: p1.y + length / d * (p2.y - p1.y)};

}

export const rotate = function rotate(points, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return points.map(({x, y}) => ({x: x * cos - y * sin, y: x * sin + y * cos}));
}

export const translate = function translate(points, delta) {
  return points.map(({x, y})=> ({x: x + delta.x, y: y + delta.y}));
}

export const polygonPath = function polygonPath(points, closed) {
  const segments = [`M${points[0].x} ${points[0].y}`];
  for (let i = 1; i < points.length; i++) {
    segments.push(`L${points[i].x} ${points[i].y}`);
  }
  if (closed) {
    segments.push('Z');
  }
  return segments.join('');
}

export const relSpatial = function(spatial, dx, dy) {
  return {x: spatial.x + dx, y: spatial.y + dy, scale: spatial.scale};
}

export const roundCorners = function roundCorners(polygon, dist, closed) {
  const startP = closed ? interpolate(polygon[0], polygon[1], dist) : polygon[0];
  const segments = [`M${startP.x} ${startP.y}`];
  const maxI = closed ? polygon.length + 1 : (polygon.length - 1);
  const len = polygon.length;
  for (let i = 1; i < maxI; i++) {
    const cornerP = polygon[i % len];
    const before = interpolate(cornerP, polygon[i - 1], dist);
    const after = interpolate(cornerP, polygon[(i + 1) % polygon.length], dist);
    segments.push(`L${before.x} ${before.y}Q${cornerP.x} ${cornerP.y} ${after.x} ${after.y}`);
  }
  if (!closed) {
    const last = polygon[polygon.length -1];
    segments.push(`L${last.x} ${last.y}`);
  }
  return segments.join('');
}

/**
 * @param {GraphNode | GraphNode[]} contents
 * @param {string || null} key
 * @param {string || null} name
 *
 * creates a data node for a card representing either a single node or a node set
 * the data node carries aggregated/derived attributes for use in the visualization
 */
export const createCardNode = function createCardNode(contents, key, name) {
  if (Array.isArray(contents)) {
    const result = new GraphNode(TYPE_AGGREGATOR, key || Cache.createUri());
    result.set(TYPE_NODE_COUNT, contents.length);
    if (name) {
      result.set(TYPE_NAME, name);
    }
    result.setBulkAssociation(TYPE_NODES, contents);
    return result;
  } else {
    if (contents.getTypeUri() === TYPE_AGGREGATOR) {
      return contents;
    }
    return contents.createContextual();
  }
}

const cloneX = function (element) {
  if (Array.isArray(element)) {
    return element.map(a => cloneX(a));
  } else if (element !== null && element !== undefined && element.constructor === Object) {
    return cloneObject(element);
  }
  // other cases: primitive or not a plain JS object, don't clone
  return element;
}

export const cloneObject = function cloneObject(object) {
  return mapValues(object, value => cloneX(value));
}

export const nodeArray = function NodeArray(source) {
  if (!source) return [];
  return Array.isArray(source) ? source : [source];
}

export const describeDescriptor = function describeDescriptor(desc, indent) {
  return Object.keys(desc).map(key => `${indent || ''}${key}: ${JSON.stringify(desc[key])}`).join();
}

export const describeSource = function describeSource(source, indent) {
  const spaces = `${indent || ''}  `;
  if (Array.isArray(source)) {
    return `[${source.map(node => node.uri).join(`\n${spaces}`)}](${source.length})`;
  } else if (!GraphNode.isGraphNode(source)) {
    return String(source);
  }
  if (source.getTypeUri() === TYPE_AGGREGATOR) {
    return `*-[${(source.get(TYPE_NODES)||[]).map(node => node.uri).join(`\n${spaces}`)}](${source.length})`;
  }
  return source.uri;
}

export const isDataEqual = function isDataEqual(nodeA, nodeB) {
  if (nodeA === nodeB) return true;
  if (nodeA.getTypeUri() === TYPE_AGGREGATOR && nodeB.getTypeUri() === TYPE_AGGREGATOR) {
    return isEqual(nodeA.get(TYPE_NODES), nodeB.get(TYPE_NODES));
  } else {
    return nodeA.getUniqueKey() === nodeB.getUniqueKey();
  }
}

export function getUnfilteredNodeArray(source, data, logLevel) {
  if (!source || source === 'this') {
    return nodeArray(data);
  } else {
    return nodeArray(resolve(data, source, logLevel));
  }
}

export function getNodeArray(inputSelector, source, data) {
  const filter = inputSelector ? Filter.fromDescriptor(inputSelector) : null;
  const unfiltered = getUnfilteredNodeArray(source, data);
  return filter ? unfiltered.filter(filter.matches) : unfiltered;
}

export function getCommonType(aggregator) {
  const nodes = aggregator.get(TYPE_NODES);
  const types = {};
  if (!nodes) {
    return null;
  }
  nodes.forEach(node => {
    types[node.getTypeUri()] = node.type;
  });

  let typeList = Object.keys(types);

  while (typeList.length > 1) {
    for (let i = 0; i < typeList.length; i++) {
      for (let j = 0; j < typeList.length; j++) {
        if (i === j) continue;
        if (types[typeList[i]].isOfType(typeList[j])) {
          delete types[typeList[i]];
          break;
        }
      }
    }
    typeList = Object.keys(types);
    if (typeList.length > 1) {
      typeList.forEach(typeUri => {
        if (typeUri !== TYPE_THING) {
          const superType = types[typeUri].superType || TypeDictionary.getType(TYPE_THING);
          types[superType.uri] = superType;
        }
      });
      typeList = Object.keys(types);
    }
  }
  return types[typeList[0]];
}

export const createContext = () => new GraphNode(TYPE_CONTEXT, BLANK_NODE_URI);

export const inspectPathSegment = function inspect(associationName) {
  const lastPos = associationName.length - 1;
  if (associationName.charAt(lastPos) === '*') {
    return {edgeType: associationName.substring(0, lastPos), recursive: true};
  } else {
    return {edgeType: associationName, recursive: false};
  }
}

export const writeToClipboard = function writeToClipboard(text) {
  const dummyField = document.createElement("textarea");
  dummyField.textContent = text;
  document.body.appendChild(dummyField);
  dummyField.select();
  document.execCommand('copy');
  dummyField.blur();
  document.body.removeChild(dummyField);
}
