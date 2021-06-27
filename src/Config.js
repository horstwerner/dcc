import {pick} from 'lodash';
import {TYPE_NAME} from "@/graph/TypeDictionary";
import cssBreadCrumbDefault from "@/components/themes/default/BreadcrumbLane.css";
import cssBreadCrumbGray from "@/components/themes/gray/BreadcrumbLane.css";
import cssMenuDefault from "@/components/themes/default/Menu.css";
import cssMenuGray from "@/components/themes/gray/Menu.css";
import cssMenuPanelDefault from "@/components/themes/default/MenuPanel.css";
import cssMenuPanelGray from "@/components/themes/gray/MenuPanel.css";
import cssRadioButtonsDefault from "@/components/themes/default/RadioButtons.css";
import cssRadioButtonsGray from "@/components/themes/gray/RadioButtons.css";
import cssAppDefault from "@/components/themes/default/App.css";
import cssAppGray from "@/components/themes/gray/App.css";


export const DEBUG_MODE = false;
export const OFFLINE_MODE = false;
export const THEME_DEFAULT = 'default';
export const THEME_GRAY = 'gray';

if (DEBUG_MODE) {
  const error = console.error;
  console.error = (...args) => {
    debugger;
    error.apply(null, args);
  }
}

export const MARGIN = 12;
export const TRANSITION_DURATION = 350;
export const HOVER_MENU_DELAY = 700;

export const SIDEBAR_PERCENT = 0.2;
export const SIDEBAR_MAX = 250;
export const MENU_WIDTH = SIDEBAR_MAX - 0.5 * MARGIN;
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

const alignMap = {
  left: 'flex-start',
  right: 'flex-end',
  center: 'center'
}

const configuration = {
  displayNameAttribute : TYPE_NAME,
  theme: THEME_DEFAULT,
  logoUrl: 'public/DCCLogo.svg',
  logoAlign: 'flex-end'
};

export const setConfig = function setConfig(config) {
  Object.assign(configuration, config);
  if (config.logoAlign) {
    configuration.logoAlign = alignMap[config.logoAlign] || 'center';
  }
}

export const getConfigs = function getConfigs(parameterList) {
  return pick(configuration, parameterList);
}

export const getConfig = function (parameterName) {
  return configuration[parameterName];
}

export const getAppCss = function getAppCss() {
  switch (configuration.theme) {
    case THEME_GRAY:
      return cssAppGray;
  }
  return cssAppDefault;
}

export const getBreadCrumbCss = function getBreadCrumbCss() {
  switch (configuration.theme) {
    case THEME_GRAY:
      return cssBreadCrumbGray;
  }
  return cssBreadCrumbDefault;
}

export const getRadioButtonCss = function getMenuCss() {
  switch (configuration.theme) {
    case THEME_GRAY:
      return cssRadioButtonsGray;
  }
  return cssRadioButtonsDefault;
}

export const getMenuCss = function getMenuCss() {
  switch (configuration.theme) {
    case THEME_GRAY:
      return cssMenuGray;
  }
  return cssMenuDefault;
}

export const getMenuPanelCss = function getMenuPanelCss() {
  switch (configuration.theme) {
    case THEME_GRAY:
      return cssMenuPanelGray;
  }
  return cssMenuPanelDefault;
}
