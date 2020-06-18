export const DEBUG_MODE = true;
export const DURATION_REARRANGEMENT = 400;

if (DEBUG_MODE) {
  const error = console.error;
  console.error = (...args) => {
    debugger;
    error.apply(null, args);
  }
}