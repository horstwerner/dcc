export function getTransformString(x, y, scale) {
  return `translate(${x}px, ${y}px) scale(${scale})`;
}

export function fit(parentWidth, parentHeight, childWidth, childHeight) {

  const scale = Math.min(parentWidth / childWidth, parentHeight / childHeight);
  const x = Math.max(0, (parentWidth - childWidth * scale) / 2);
  const y = Math.max(0, (parentHeight - childHeight * scale) / 2);

  return {x, y, scale};
}