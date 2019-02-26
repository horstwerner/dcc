export function getTransformString(x, y, scale) {
  return `translate(${x}px, ${y}px) scale(${scale})`;
}

export function fit(parentWidth, parentHeight, childWidth, childHeight, xOffset, yOffset) {

  const scale = Math.min(parentWidth / childWidth, parentHeight / childHeight);
  const x = Math.max(0, (parentWidth - childWidth * scale) / 2) + (xOffset || 0);
  const y = Math.max(0, (parentHeight - childHeight * scale) / 2) + (yOffset || 0);

  return {x, y, scale};
}