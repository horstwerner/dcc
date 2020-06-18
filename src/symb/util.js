import {resolveAttribute} from "@/graph/Cache";

export function getTransformString(x, y, scale) {
  return `translate(${x}px, ${y}px) scale(${scale})`;
}

export const fit = function fit(parentWidth, parentHeight, childWidth, childHeight, xOffset, yOffset) {

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
  debugger
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