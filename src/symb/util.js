export function getTransformString(x, y, scale) {
  return `translate(${x}px, ${y}px) scale(${scale})`;
}

export function fit(parentWidth, parentHeight, childWidth, childHeight, xOffset, yOffset) {

  const scale = Math.min(parentWidth / childWidth, parentHeight / childHeight);
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