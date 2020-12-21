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
    this.colorChanges = [];
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
    const {x, y, scale} = component.spatial;
    if (newX === x && newY === y && newScale === scale) {
      return;
    }
    if (isNaN(newX) || isNaN(newY) || isNaN(newScale)) {
      throw new Error(`NaN passed as target coordinate for Tewwn`);
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

  addColorChange (element, newColor) {
    this.colorChanges.push({
      element: element,
      startColor: ColorUtil.splitColor(element.getColor()),
      endColor: ColorUtil.splitColor(newColor)
    });
  };

  /**
   *
   * @param {Moveable} card
   * @param {number} targetAlpha
   */
  addFade(card, targetAlpha) {
    const startAlpha = card.getAlpha();
    if (startAlpha === targetAlpha) {
      return;
    }
    this.alphaChanges.push({
      element: card,
      startAlpha: startAlpha,
      deltaAlpha: targetAlpha - startAlpha
    });
  };

  addInterpolation(startArray, endArray, callback) {
    this.interpolations.push({
      startArray: startArray,
      endArray: endArray,
      callback: callback
    });
  };

  interpolate(uneasedTau) {
    this.frames++;
    const tau = uneasedTau >= 1 ? 1 : Math.max(0, this.easing(uneasedTau));
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.element.updateSpatial({x: p.startX + tau * p.deltaX, y:  p.startY + tau * p.deltaY, scale: p.startScale + tau * p.deltaScale});
    }
    for (let i = 0; i < this.alphaChanges.length; i++) {
      const ac = this.alphaChanges[i];
      ac.element.updateAlpha(ac.startAlpha + tau * ac.deltaAlpha);
    }
    for (let i = 0; i < this.interpolations.length; i++) {
      const ip = this.interpolations[i];
      const interpArray = [];
      for (let j = 0; j < ip.startArray.length; j++) {
        interpArray.push(ip.startArray[j] + tau * (ip.endArray[j] - ip.startArray[j]));
      }
      ip.callback(interpArray);
    }
    this.startTime = performance.now();
  };

  onEndCall(callback) {
    this.parent.onEndCall(callback);
  };

  newPhase (delay, duration, easingfunction) {
    return this.parent.newPhase(delay, duration, easingfunction);
  };
}

export default class Tween {

  constructor(duration, easing) {
    this.duration = duration;
    this.phases = [];
    // phase[0] spans the complete tween duration
    // other phases can span a smaller timeinterval
    this.phases[0] = new Phase(this, duration, easing);
    this.interpolate = this.interpolate.bind(this);
  };

  interpolate(time) {
    if (this.stopped) return;
    window.requestAnimationFrame(this.interpolate);
    this.frames++;
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

  addColorChange(element, newColor) {
    this.phases[0].addColorChange(element, newColor);
    return this;
  };


  addFade = function (element, targetOpacity) {
    this.phases[0].addFade(element, targetOpacity);
    return this;
  };

  addInterpolation = function (startArray, endArray, callback) {
    this.phases[0].addInterpolation(startArray, endArray, callback);
    return this;
  };


  newPhase = function (delay, duration, easingfunction) {
    if (duration && duration + (delay || 0) > this.duration) {
      throw new Error('Phase duration and delay exceed tween duration ' + this.duration);
    }
    if (delay && delay > this.duration) {
      throw new Error('Phase delay exceeds tween duration ' + this.duration);
    }
    const result = new Phase(this, duration || (this.duration - (delay || 0)), easingfunction, delay);
    this.phases.push(result);
    return result;
  };


  getDuration = function () {
    return this.duration;
  };

  /**
   *
   * @param {Moveable} card
   * @param {number} newX
   * @param {number} newY
   * @param {number} newScale
   * @param {number} newWidth
   * @param {number} newHeight
   */
  addTransformAndSize(card, newX, newY, newScale, newWidth, newHeight) {
    this.phases[0].addTransformAndSize(card, newX, newY, newScale, newWidth, newHeight);
  };

  finish = function () {
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

  start() {

    activeTweens.push(this);
    // noinspection JSUnresolvedVariable
    this.startTime = performance.now();
    this.frames = 0;

    for (let i = 0; i < this.phases.length; i++) {
      this.phases[i].status = STATUS_ACTIVE;
    }

    window.requestAnimationFrame(this.interpolate);
    return this;
  };

  onEndCall = function (callback) {
    if (typeof callback !== 'function') throw new Error(callback.toString() + ' is not a function');
    if (!this.onEndCallback) {
      this.onEndCallback = callback;
    } else if (Array.isArray(this.onEndCallback)) {
      this.onEndCallback.push(callback);
    } else {
      this.onEndCallback = [this.onEndCallback];
      this.onEndCallback.push(callback);
    }
    return this;
  };

  stop = function () {
    this.stopped = true;
  };

}
