const activeTweens = [];
const STATUS_ACTIVE = 1;
const STATUS_FINISHED = 2;

const easeInOut = function (t) {
  return 0.5 * (Math.sin((t - 0.5) * Math.PI) + 1);
 // return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
};

// noinspection JSUnusedGlobalSymbols
export const noEase = function (t) {
  return t;
};

class Phase {
  constructor(parent, duration, easing, delay) {
    this.parent = parent;
    this.delay = delay || 0;
    this.duration = duration;
    this.particles = [];
    this.alphaChanges = [];
    this.interpolations = [];
    this.easing = easing || easeInOut;
    this.status = 0;
  };

  getDuration() {
    return this.duration;
  };

  getDelay() {
    return this.delay;
  }

  /**
   *
   * @param {Component} component
   * @param {Number} newX
   * @param {Number} newY
   * @param {Number} newScale
   */
  addTransform(component, newX, newY, newScale) {
    const {x, y, scale} = component.getSpatial();
    if (newX === x && newY === y && newScale === scale) {
      return;
    }
    if (isNaN(newX) || isNaN(newY) || isNaN(newScale)) {
      throw new Error(`NaN passed as target coordinate for Tween`);
    }
    this.particles.push({
      element: component,
      startX: x,
      startY: y,
      startScale: scale,
      deltaX: newX - x,
      deltaY: newY - y,
      deltaScale: newScale - scale
    });
    return this;
  };

  /**
   *
   * @param {Component} component
   * @param {number} targetAlpha
   */
  addFade(component, targetAlpha) {
    const startAlpha = component.getAlpha();
    if (startAlpha === targetAlpha) {
      return;
    }
    this.alphaChanges.push({
      element: component,
      startAlpha: startAlpha,
      deltaAlpha: targetAlpha - startAlpha
    });
  };

  addInterpolation(startValues, endValues, callback) {
    Object.keys(startValues).forEach(key => {
      if (isNaN(startValues[key])) {
        debugger
      }
    });
    this.interpolations.push({
      startValues: {...startValues},
      endValues: {...endValues},
      callback: callback
    });
  };

  interpolate(uneasedTau) {
    const tau = uneasedTau >= 1 ? 1 : Math.max(0, this.easing(uneasedTau));
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.element.setSpatial({x: p.startX + tau * p.deltaX, y:  p.startY + tau * p.deltaY, scale: p.startScale + tau * p.deltaScale});
    }
    for (let i = 0; i < this.alphaChanges.length; i++) {
      const ac = this.alphaChanges[i];
      ac.element.setAlpha(ac.startAlpha + tau * ac.deltaAlpha);
    }
    for (let i = 0; i < this.interpolations.length; i++) {
      const ip = this.interpolations[i];
      const interpolatedValues = {};
      Object.keys(ip.startValues).forEach(key => interpolatedValues[key] = ip.startValues[key] + tau * (ip.endValues[key] - ip.startValues[key]))
      ip.callback(interpolatedValues);
    }
    this.startTime = performance.now();
  };

  onEndCall(callback) {
    this.parent.onEndCall(callback);
  };

  newPhase (delay, duration, easingFunction) {
    return this.parent.newPhase(delay, duration, easingFunction);
  };
}

export default class Tween {

  constructor(duration, easing) {
    this.duration = duration;
    this.phases = [];
    this.started = false;
    // phase[0] spans the complete tween duration
    // other phases can span a smaller time interval
    this.phases[0] = new Phase(this, duration, easing);
    this.interpolate = this.interpolate.bind(this);
  };

  interpolate(time) {
    if (this.stopped) return;
    window.requestAnimationFrame(this.interpolate);
    for (let i = 0; i < this.phases.length; i++) {
      const phase = this.phases[i];
      const tau = Math.min((time - this.startTime - phase.delay) / phase.duration, 1);
      if (phase.status === STATUS_FINISHED || tau < 0) continue;
      phase.interpolate(tau);
      if (tau >= 1) {
        phase.status = STATUS_FINISHED;
      }
    }
    if (this.phases[0].status === STATUS_FINISHED) {
      this.finish();
    }
  };

  /**
   *
   * @param {Component} component
   * @param {Number} newX
   * @param {Number} newY
   * @param {Number} newScale
   */
  addTransform(component, newX, newY, newScale) {
    this.phases[0].addTransform(component, newX, newY, newScale);
    return this;
  };

  addFade (element, targetOpacity) {
    this.phases[0].addFade(element, targetOpacity);
    return this;
  };

  addInterpolation (startValues, endValues, callback) {
    this.phases[0].addInterpolation(startValues, endValues, callback);
    return this;
  };


  newPhase (delay, duration, easingFunction) {
    if (duration && duration + (delay || 0) > this.duration) {
      throw new Error('Phase duration and delay exceed tween duration ' + this.duration);
    }
    if (delay && delay > this.duration) {
      throw new Error('Phase delay exceeds tween duration ' + this.duration);
    }
    const result = new Phase(this, duration || (this.duration - (delay || 0)), easingFunction, delay);
    this.phases.push(result);
    return result;
  };


  getDuration  () {
    return this.duration;
  };

  /**
   *
   * @param {Component} component
   * @param {number} newX
   * @param {number} newY
   * @param {number} newScale
   * @param {number} newWidth
   * @param {number} newHeight
   */
  addTransformAndSize(component, newX, newY, newScale, newWidth, newHeight) {
    this.phases[0].addTransformAndSize(component, newX, newY, newScale, newWidth, newHeight);
  };

  finish () {
    this.stopped = true;
    if (this.onEndCallback) {
      if (this.onEndCallback.constructor === Array) {
        for (let i = 0; i < this.onEndCallback.length; i++) {
          this.onEndCallback[i](this);
        }
      } else {
        this.onEndCallback(this);
      }
    }
    this.nextAnimationframe = null;
    activeTweens.splice(activeTweens.indexOf(this));
  };

  isRunning() {
    return this.started && !this.stopped;
  }

  start() {

    activeTweens.push(this);
    this.started = true;
    // noinspection JSUnresolvedVariable
    this.startTime = performance.now();

    for (let i = 0; i < this.phases.length; i++) {
      this.phases[i].status = STATUS_ACTIVE;
    }

    window.requestAnimationFrame(this.interpolate);
    return this;
  };

  onEndCall (callback, forceFirst) {
    if (typeof callback !== 'function') throw new Error(callback.toString() + ' is not a function');
    if (!this.onEndCallback) {
      this.onEndCallback = callback;
      return this;
    } else if (!Array.isArray(this.onEndCallback)) {
      this.onEndCallback = [this.onEndCallback];
    }

    if (forceFirst) {
      this.onEndCallback.unshift(callback);
    } else {
      this.onEndCallback.push(callback);
    }

    return this;
  };

  stop = function () {
    this.stopped = true;
  };

}
