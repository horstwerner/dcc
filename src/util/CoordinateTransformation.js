export const inParentCoords = (spatial, {x,y}) => ({
  x: x * spatial.scale + spatial.x,
  y: y * spatial.scale + spatial.y
});

export const inChildCoords = (spatial, {x,y}) => ({
  x: (x - spatial.x) / spatial.scale,
  y: (y - spatial.y) / spatial.scale
});

/**
 *
 * @param pivot: {{x: number, y: number}} pivot point in parent coordinates (screen pixels)
 * @param newScale: number new scaling factor
 * @param oldSpatial {{x: number, y: number, scale: number}}old spatial (position and scale) of the child system
 * @returns {{x: number, y: number, scale: number}}
 */
export const zoomAround = function (pivot, newScale, oldSpatial) {

  const pivotInChild = inChildCoords(oldSpatial, pivot);

  // inParenCoords(newSpatial, pivotInChild) = inParentCoords(oldSpatial, pivotInChild);
  //
  // => px * newSpatial.scale + newSpatial.x = px * oldSpatial.scale + oldSpatial.x
  // => newSpatial.x = px * oldSpatial.scale + oldSpatial.x - px * newSpatial.scale
  // => newSpatial.x = px * oldSpatial.scale = px * newSpatial.scale + oldSpatial.x
  // => newSpatial.x = px * (oldSpatial.scale - newSpatial.scale) + oldSpatial.x

  return {
    x: pivotInChild.x * (oldSpatial.scale - newScale) + oldSpatial.x,
    y: pivotInChild.y * (oldSpatial.scale - newScale) + oldSpatial.y,
    scale: newScale
  };
}

