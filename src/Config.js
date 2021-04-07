import { pick } from 'lodash';
import {TYPE_NAME} from "@/graph/TypeDictionary";

export const DEBUG_MODE = true;
export const OFFLINE_MODE = false;

if (DEBUG_MODE) {
  const error = console.error;
  console.error = (...args) => {
    debugger;
    error.apply(null, args);
  }
}

export const MENU_WIDTH = 224;
export const MARGIN = 16;
export const TRANSITION_DURATION = 320;
export const HOVER_MENU_DELAY = 700;

export const SIDEBAR_PERCENT = 0.2;
export const SIDEBAR_MAX = 250;
export const CANVAS_WIDTH = 1980 - SIDEBAR_MAX - 10;
export const MAX_CARD_HEIGHT = 1000;

export const COLOR2_LIGHT = '#c5d4d4';
export const COLOR2_MEDIUM = '#acbcbf';
export const COLOR2_MEDIUM_DARK = '#83a3a3'
export const COLOR2_DARK = '#567373';

export const SIDEBAR_BACK_COLOR = '#EEEEEA';

export const SIDEBAR_BACK_COLOR2 = '#bcbdb7';

export const QCC_BLUE_1 = 'rgb(93,113,123)';
export const QCC_BLUE_2 = 'rgb(60,78,86)';
export const QCC_BLUE_3 = 'rgb(52,67,74)';

export const QCC_GRAY_1 = '#EFEFEC';
export const QCC_GRAY_2 = '#d6d6d2';
export const QCC_GRAY_3 = '#bdbdb9';
export const QCC_GRAY_4 = '#a3a3a0';
export const QCC_GRAY_5 = '#696966';

export const QCC_GRAY_SIDEBAR = `rgb(233,234,228)`;

const configuration = {
  displayNameAttribute : TYPE_NAME
};

export const setConfig = function setConfig(config) {
  Object.assign(configuration, config);
}

export const getConfigs = function getConfigs(parameterList) {
  return pick(configuration, parameterList);
}

export const getConfig = function (parameterName) {
  return configuration[parameterName];
}
