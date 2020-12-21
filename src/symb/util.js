import Cache, {resolveAttribute, TYPE_AGGREGATOR, TYPE_NODES} from "@/graph/Cache";
import GraphNode from "@/graph/GraphNode";

export function getTransformString(x, y, scale) {
  return `translate(${x}px, ${y}px) scale(${scale})`;
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

export const flexContentAlign = function flexContentAlign(hAlign) {
  switch (hAlign) {
    case 'left': return 'flex-start';
    case 'right': return 'flex-end';
    case 'center': return 'center';
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

export const roundCorners = function roundCorners(polygon, dist, closed) {
  const startP = closed ? interpolate(polygon[0], polygon[1], dist) : polygon[0];
  const segments = [`M${startP.x} ${startP.y}`];
  const maxI = closed ? polygon.length + 1 : (polygon.length - 1);
  for (let i = 1; i < maxI; i++) {
    const cornerP = polygon[i];
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
 *
 * creates a data node for a card representing either a single node or a node set
 * the data node carries aggregated/derived attributes for use in the visualization
 */
export const createCardNode = function createCardNode(contents) {
  if (Array.isArray(contents)) {
    const result = new GraphNode(TYPE_AGGREGATOR, Cache.createUri());
    result.setBulkAssociation(TYPE_NODES, contents);
    return result;
  } else {
    if (contents.getTypeUri() === TYPE_AGGREGATOR) {
      return contents;
    }
    //TODO: why create contextual for individual nodes?
    return contents.createContextual();
  }
}