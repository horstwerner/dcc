export const DEBUG_MODE = true;
export const DURATION_REARRANGEMENT = 400;

if (DEBUG_MODE) {
  const error = console.error;
  console.error = (...args) => {
    debugger;
    error.apply(null, args);
  }
}
export const MARGIN = 24;

export const SIDEBAR_PERCENT = 0.2;
export const SIDEBAR_MAX = 250;
export const CANVAS_WIDTH = 1980 - SIDEBAR_MAX - 10;
export const MAX_CARD_HEIGHT = 1000;
